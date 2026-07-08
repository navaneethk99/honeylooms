import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { adminOnly } from '@/access/adminOnly'

export const FeaturedOutfits: GlobalConfig = {
  slug: 'featured-outfits',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [
      ({ doc, req: { payload } }) => {
        payload.logger.info(`Revalidating featured-outfits global...`)
        revalidateTag('global_featured-outfits', 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'outfits',
      label: 'Outfits',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      required: true,
      validate: (value) => {
        if (!value || !Array.isArray(value) || value.length !== 6) {
          return 'Please select exactly 6 outfits.'
        }
        return true
      },
      admin: {
        description: 'Select exactly 6 products/outfits to be shown on the home screen.',
      },
    },
  ],
}
