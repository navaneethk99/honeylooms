import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'
import { convertImageUploadToWebP } from '@/hooks/convertImageUploadToWebP'

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
    defaultColumns: ['filename', 'submittedBy', 'products', 'source', 'status', 'createdAt'],
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
      name: 'products',
      type: 'relationship',
      hasMany: true,
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
    beforeOperation: [convertImageUploadToWebP],
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
    imageSizes: [
      {
        name: 'preview',
        width: 640,
        height: 640,
        fit: 'inside',
        withoutEnlargement: true,
        formatOptions: {
          format: 'webp',
          options: {
            quality: 60,
          },
        },
      },
    ],
    mimeTypes: ['image/*', 'video/*'],
    staticDir: path.resolve(dirname, '../../public/gallery'),
  },
}
