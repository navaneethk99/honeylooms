import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { cacheLife, cacheTag } from 'next/cache'
import { getPayload } from 'payload'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 2) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

export async function getCachedDocument(collection: Collection, slug: string, depth = 2) {
  'use cache'
  cacheLife('days')
  cacheTag(`${collection}_${slug}`)

  return getDocument(collection, slug, depth)
}
