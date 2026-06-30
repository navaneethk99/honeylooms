import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Collections: CollectionConfig = {
  slug: 'collections',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  hooks: {
    afterChange: [
      ({ doc, req: { payload } }) => {
        try {
          const { revalidateTag, revalidatePath } = require('next/cache')
          payload.logger.info(`Revalidating collections cache: ${doc.slug}`)
          revalidateTag('collections')
          revalidatePath('/collections')
          if (doc.slug) {
            revalidatePath(`/collections/${doc.slug}`)
          }
        } catch (err) {
          payload.logger.error(`Error revalidating collections: ${err}`)
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { payload } }) => {
        try {
          const { revalidateTag, revalidatePath } = require('next/cache')
          payload.logger.info(`Revalidating deleted collections cache: ${doc?.slug}`)
          revalidateTag('collections')
          revalidatePath('/collections')
          if (doc?.slug) {
            revalidatePath(`/collections/${doc.slug}`)
          }
        } catch (err) {
          payload.logger.error(`Error revalidating deleted collections: ${err}`)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'showOnHomePage',
      type: 'checkbox',
      label: 'Show on Home Page',
      defaultValue: false,
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'banner',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
