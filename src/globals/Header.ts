import type { GlobalConfig } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [
      ({ doc, req: { payload } }) => {
        payload.logger.info(`Revalidating header global...`)
        revalidateTag('global_header', 'max')
        // The header is rendered by the root layout, so invalidate that cached layout as well.
        revalidatePath('/', 'layout')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
  ],
}
