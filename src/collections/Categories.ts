import { revalidatePath, revalidateTag } from 'next/cache'
import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',
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
        payload.logger.info(`Revalidating categories cache: ${doc.slug}`)
        revalidateTag('categories', 'max')
        revalidatePath('/shop')
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { payload } }) => {
        payload.logger.info(`Revalidating deleted categories cache: ${doc?.slug}`)
        revalidateTag('categories', 'max')
        revalidatePath('/shop')
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
    slugField({
      position: undefined,
    }),
  ],
}
