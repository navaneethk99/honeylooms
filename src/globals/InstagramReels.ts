import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'

const isInstagramReelUrl = (value: string) => {
  try {
    const url = new URL(value)
    const isInstagramHost =
      url.hostname === 'instagram.com' || url.hostname.endsWith('.instagram.com')
    const [, contentType, shortcode] = url.pathname.split('/')

    return isInstagramHost && contentType === 'reel' && Boolean(shortcode)
  } catch {
    return false
  }
}

export const InstagramReels: GlobalConfig = {
  slug: 'instagram-reels',
  label: 'Instagram Reels',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [
      ({ doc, req: { payload } }) => {
        payload.logger.info(`Revalidating instagram-reels global...`)
        revalidateTag('global_instagram-reels', 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'reels',
      type: 'array',
      label: 'Reels',
      labels: {
        singular: 'Reel',
        plural: 'Reels',
      },
      minRows: 4,
      maxRows: 4,
      required: true,
      admin: {
        description:
          'Add exactly 4 Instagram reel URLs from @honeylooms. Replace a URL here to update the home page preview.',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'Reel URL',
          required: true,
          validate: (value: unknown) => {
            if (typeof value !== 'string' || value.trim().length === 0) {
              return 'Please add an Instagram reel URL.'
            }

            if (!isInstagramReelUrl(value)) {
              return 'Please add a valid Instagram reel URL.'
            }

            return true
          },
        },
      ],
    },
  ],
}
