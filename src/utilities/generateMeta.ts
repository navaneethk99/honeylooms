import type { Metadata } from 'next'

import type { Page, Product } from '../payload-types'

import { createPageMetadata, getDocumentPath, siteDescription } from './seo'

export const generateMeta = async ({
  collection = 'pages',
  doc,
  noIndex = false,
}: {
  collection?: 'pages' | 'products'
  doc: Page | Product | null
  noIndex?: boolean
}): Promise<Metadata> => {
  return createPageMetadata({
    description: doc?.meta?.description || siteDescription,
    image: typeof doc?.meta?.image === 'object' ? doc.meta.image : undefined,
    noIndex: noIndex || !doc || doc._status === 'draft',
    path: getDocumentPath(collection, doc?.slug),
    title: doc?.meta?.title || doc?.title || 'Honeylooms',
  })
}
