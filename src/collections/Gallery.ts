import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Gallery: CollectionConfig = {
  slug: 'gallery',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: ({ req }) => {
      if (adminOnly({ req })) return true

      return {
        status: {
          equals: 'approved',
        },
      }
    },
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['filename', 'submittedBy', 'product', 'source', 'status', 'createdAt'],
    group: 'Gallery',
    useAsTitle: 'filename',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Description',
    },
    {
      name: 'submittedBy',
      type: 'text',
      label: 'Submitted by',
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: 'Admin upload', value: 'admin' },
        { label: 'Community submission', value: 'community' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'approved',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { payload } }) => {
        try {
          const { revalidatePath } = require('next/cache')
          revalidatePath('/gallery')
        } catch (error) {
          payload.logger.error(`Unable to revalidate gallery: ${error}`)
        }

        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { payload } }) => {
        try {
          const { revalidatePath } = require('next/cache')
          revalidatePath('/gallery')
        } catch (error) {
          payload.logger.error(`Unable to revalidate gallery: ${error}`)
        }

        return doc
      },
    ],
  },
  upload: {
    mimeTypes: ['image/*', 'video/*'],
    staticDir: path.resolve(dirname, '../../public/gallery'),
  },
}
