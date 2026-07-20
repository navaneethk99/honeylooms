import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'

export const HomepageBanners: CollectionConfig = {
  slug: 'homepage-banners',
  labels: {
    singular: 'Homepage Banner',
    plural: 'Homepage Banners',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'updatedAt'],
    description: 'The most recently updated active banner is displayed on the homepage.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Used in the admin panel only.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Only active banners are eligible to appear on the homepage.',
      },
    },
    {
      name: 'desktopImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Desktop Image',
      admin: {
        description: 'Recommended for landscape desktop and tablet screens.',
      },
    },
    {
      name: 'mobileImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Mobile Image',
      admin: {
        description: 'Recommended for portrait mobile screens.',
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { context, payload } }) => {
        if (!context.disableRevalidate) {
          payload.logger.info('Revalidating homepage after banner change')
          revalidatePath('/')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { context, payload } }) => {
        if (!context.disableRevalidate) {
          payload.logger.info('Revalidating homepage after banner deletion')
          revalidatePath('/')
        }
        return doc
      },
    ],
  },
}
