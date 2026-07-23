import type { GroupField } from 'payload'
import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'
import { calculateCartSubtotalFromStoredItems, calculatePromoDiscount } from '@/utilities/pricing'

export const codAdapter = (props: PaymentAdapterArgs): PaymentAdapter => {
  const { label = 'Cash on Delivery', groupOverrides } = props

  const groupField: GroupField = {
    name: 'cod',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => data?.paymentMethod === 'cod',
      ...groupOverrides?.admin,
    },
    fields: groupOverrides?.fields?.({
      defaultFields: [
        {
          name: 'codFee',
          type: 'number',
          label: 'COD Fee',
        },
      ],
    }) || [
      {
        name: 'codFee',
        type: 'number',
        label: 'COD Fee',
      },
    ],
  }

  return {
    name: 'cod',
    label,
    group: groupField,
    initiatePayment: async ({ data, req }) => {
      const payload = req.payload
      const billingAddress = data.billingAddress
      const cart = data.cart
      const customerEmail = data.customerEmail
      const shippingAddress = data.shippingAddress
      const currency = data.cart?.currency === 'USD' ? 'USD' : 'USD'

      if (!cart || !cart.items?.length) {
        throw new Error('Cart is empty or not provided.')
      }

      if (!customerEmail || typeof customerEmail !== 'string') {
        throw new Error('A valid customer email is required to make a purchase.')
      }

      // Cash on Delivery adds Rs. 25 charge (2500 paise)
      const codFee = 2500
      const subtotal = await calculateCartSubtotalFromStoredItems(req, cart.items)

      let discountAmount = 0
      const promoCode = (data as any).promoCode || (req.data as any)?.promoCode
      if (promoCode) {
        const promoCodes = await payload.find({
          collection: 'promo-codes',
          where: {
            and: [{ code: { equals: promoCode } }, { active: { equals: true } }],
          },
          req,
        })
        const promo = promoCodes.docs?.[0]
        if (promo) {
          const minOrder = (promo.minOrderValue || 0) * 100
          if (subtotal >= minOrder) {
            discountAmount = calculatePromoDiscount({
              discountPercentage: promo.discountPercentage,
              maxDiscountAmount:
                typeof promo.maxDiscount === 'number' ? promo.maxDiscount * 100 : null,
              subtotal,
            })
          }
        }
      }

      const amount = subtotal - discountAmount + codFee

      const flattenedCart = cart.items.map((item: any) => {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID =
          item.variant && typeof item.variant === 'object' ? item.variant.id : item.variant
        const { id: _id, product: _product, variant: _variant, ...customProperties } = item

        return {
          ...customProperties,
          product: productID,
          quantity: item.quantity,
          ...(variantID ? { variant: variantID } : {}),
        }
      })

      // 1. Create transaction with succeeded status (directly accepted)
      const transaction = await payload.create({
        collection: 'transactions',
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          billingAddress,
          cart: cart.id,
          currency,
          items: flattenedCart,
          paymentMethod: 'cod',
          status: 'succeeded',
          cod: {
            codFee,
          },
        },
        req,
      })

      // 2. Create the order with status "processing"
      const order = await payload.create({
        collection: 'orders',
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          currency,
          items: flattenedCart,
          orderCode: '',
          paymentMethod: 'cod',
          shippingAddress,
          status: 'processing',
          transactions: [transaction.id],
        },
        req,
      })

      // 3. Mark the cart as purchased/completed
      await payload.update({
        id: cart.id,
        collection: 'carts',
        data: {
          purchasedAt: new Date().toISOString(),
        },
        req,
      })

      // 4. Update the transaction with the order reference
      await payload.update({
        id: transaction.id,
        collection: 'transactions',
        data: {
          order: order.id,
        },
        req,
      })

      return {
        message: 'COD order accepted successfully',
        orderID: order.id,
        orderCode: order.orderCode,
        accessToken: order.accessToken,
      }
    },
    confirmOrder: async ({ data, req }) => {
      const payload = req.payload
      const orderID = data.orderID

      if (!orderID) {
        throw new Error('Order ID is required.')
      }

      const order = await payload.findByID({
        collection: 'orders',
        id: orderID,
        req,
      })

      const transactionID = order.transactions?.[0]
        ? typeof order.transactions[0] === 'object'
          ? order.transactions[0].id
          : order.transactions[0]
        : 0

      return {
        message: 'COD order already confirmed',
        orderID: order.id as any,
        orderCode: order.orderCode,
        transactionID: transactionID as any,
      }
    },
  }
}
