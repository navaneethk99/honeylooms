import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    defaultColumns: ['product', 'rating', 'customerEmail', 'createdAt'],
    group: 'Ecommerce',
    useAsTitle: 'customerEmail',
  },
  access: {
    create: () => false,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      index: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'customerEmail',
      type: 'email',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'review',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
