import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const FeaturedOutfits: GlobalConfig = {
  slug: 'featured-outfits',
  access: {
    read: () => true,
    update: adminOnly,
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
