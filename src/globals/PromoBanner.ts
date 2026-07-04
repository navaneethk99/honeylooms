import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { revalidateTag } from 'next/cache'

export const PromoBanner: GlobalConfig = {
  slug: 'promo-banner',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [
      ({ doc, req: { payload } }) => {
        payload.logger.info(`Revalidating promo-banner global...`)
        revalidateTag('global_promo-banner', 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enable Banner',
      defaultValue: false,
    },
    {
      name: 'messages',
      type: 'array',
      label: 'Banner Messages',
      labels: {
        singular: 'Message',
        plural: 'Messages',
      },
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: 'Message Text',
        },
      ],
      admin: {
        condition: (data) => Boolean(data?.enabled),
      },
    },
    {
      name: 'interval',
      type: 'number',
      label: 'Rotation Interval (seconds)',
      defaultValue: 4,
      required: true,
      min: 1,
      max: 60,
      admin: {
        condition: (data) => Boolean(data?.enabled),
      },
    },
  ],
}
