import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'discountPercentage', 'active', 'createdAt'],
  },
  endpoints: [
    {
      path: '/validate',
      method: 'get',
      handler: async (req) => {
        const url = new URL(req.url || '', 'http://localhost')
        const code = url.searchParams.get('code')?.trim()
        const subtotalStr = url.searchParams.get('subtotal')

        if (!code) {
          return Response.json({ valid: false, message: 'Promo code is required.' }, { status: 400 })
        }

        const subtotal = parseInt(subtotalStr || '0')

        try {
          const promoCodes = await req.payload.find({
            collection: 'promo-codes',
            where: {
              and: [
                { code: { equals: code } },
                { active: { equals: true } },
              ],
            },
            req,
          })

          const promo = promoCodes.docs?.[0]
          if (!promo) {
            return Response.json({ valid: false, message: 'Invalid or inactive promo code.' })
          }

          const minOrder = (promo.minOrderValue || 0) * 100 // convert to paise
          if (subtotal < minOrder) {
            return Response.json({
              valid: false,
              message: `Minimum order value of Rs. ${promo.minOrderValue} is required to use this coupon.`,
            })
          }

          // Calculate discount in paise
          let discount = Math.round(subtotal * (promo.discountPercentage / 100))
          if (promo.maxDiscount) {
            const maxD = promo.maxDiscount * 100
            if (discount > maxD) {
              discount = maxD
            }
          }

          return Response.json({
            valid: true,
            code: promo.code,
            discountPercentage: promo.discountPercentage,
            discountAmount: discount, // in paise
            message: `Coupon "${promo.code}" applied!`,
          })
        } catch (error) {
          req.payload.logger.error(`Error validating promo code "${code}": ${error}`)
          return Response.json({ valid: false, message: 'Internal server error validating code.' }, { status: 500 })
        }
      },
    },
  ],
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        placeholder: 'e.g. SAVE20',
      },
    },
    {
      name: 'discountPercentage',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      admin: {
        placeholder: 'e.g. 20',
      },
    },
    {
      name: 'maxDiscount',
      type: 'number',
      min: 0,
      admin: {
        placeholder: 'Maximum discount amount in Rs. (optional)',
      },
    },
    {
      name: 'minOrderValue',
      type: 'number',
      min: 0,
      admin: {
        placeholder: 'Minimum order value in Rs. (optional)',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
