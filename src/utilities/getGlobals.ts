import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { cacheLife, cacheTag } from 'next/cache'
import { getPayload } from 'payload'

type Global = keyof Config['globals']

export async function getGlobal<T extends Global>(slug: T, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

export async function getCachedGlobal<T extends Global>(slug: T, depth = 0) {
  'use cache'
  cacheLife('days')
  cacheTag(`global_${slug}`)

  return getGlobal<T>(slug, depth)
}
