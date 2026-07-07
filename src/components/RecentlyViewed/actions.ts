'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import type { Product } from '@/payload-types'

export async function fetchProductsByIds(ids: (string | number)[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return []

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'products',
      where: {
        id: {
          in: ids,
        },
      },
      limit: 6,
    })

    // Sort the retrieved products to match the exact order of the IDs in localStorage
    return result.docs.sort(
      (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)
    ) as Product[]
  } catch (e) {
    console.error('Failed to fetch recently viewed products by IDs:', e)
    return []
  }
}
