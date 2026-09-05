import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import { cacheLife, cacheTag } from 'next/cache'
import { getPayload } from 'payload'

import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getCanonicalURL, getDocumentPath, isSearchIndexable } from '@/utilities/seo'

const staticRoutes = [
  '',
  '/about-us',
  '/careers',
  '/collections',
  '/deliveries-and-returns',
  '/disclaimer',
  '/gallery',
  '/shop',
  '/sizing',
  '/terms-and-conditions',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('hours')
  cacheTag('pages', 'products', 'collections')

  if (!isSearchIndexable()) return []

  const payload = await getPayload({ config: configPromise })

  const [pages, products, collections] = await Promise.all([
    payload.find({
      collection: 'pages',
      depth: 0,
      draft: false,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
    payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      select: {
        gallery: true,
        meta: true,
        slug: true,
        updatedAt: true,
      },
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
    payload.find({
      collection: 'collections',
      depth: 1,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      select: {
        poster: true,
        slug: true,
        updatedAt: true,
      },
    }),
  ])

  const staticEntries = staticRoutes.map((route) => ({
    changeFrequency: route === '' || route === '/shop' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : route === '/shop' ? 0.9 : 0.7,
    url: getCanonicalURL(route || '/'),
  })) satisfies MetadataRoute.Sitemap

  const pageEntries = pages.docs
    .filter((page) => page.slug)
    .map((page) => ({
      changeFrequency: 'monthly',
      lastModified: page.updatedAt,
      priority: 0.7,
      url: getCanonicalURL(getDocumentPath('pages', page.slug)),
    })) satisfies MetadataRoute.Sitemap

  const productEntries = products.docs
    .filter((product) => product.slug)
    .map((product) => ({
      changeFrequency: 'weekly',
      lastModified: product.updatedAt,
      images: Array.from(
        new Set(
          [product.meta?.image, ...(product.gallery?.map(({ image }) => image) || [])].flatMap(
            (image) =>
              typeof image === 'object' && image?.url
                ? [getCanonicalURL(getMediaUrl(image.url))]
                : [],
          ),
        ),
      ),
      priority: 0.8,
      url: getCanonicalURL(getDocumentPath('products', product.slug)),
    })) satisfies MetadataRoute.Sitemap

  const collectionEntries = collections.docs
    .filter((collection) => collection.slug)
    .map((collection) => ({
      changeFrequency: 'weekly',
      lastModified: collection.updatedAt,
      images:
        typeof collection.poster === 'object' && collection.poster?.url
          ? [getCanonicalURL(getMediaUrl(collection.poster.url))]
          : [],
      priority: 0.8,
      url: getCanonicalURL(getDocumentPath('collections', collection.slug)),
    })) satisfies MetadataRoute.Sitemap

  const entries = new Map<string, MetadataRoute.Sitemap[number]>()

  for (const entry of [...staticEntries, ...pageEntries, ...productEntries, ...collectionEntries]) {
    // CMS pages can share a static route, including the homepage. Emit each URL once.
    entries.set(entry.url, {
      ...entry,
      ...entries.get(entry.url),
      ...('lastModified' in entry ? { lastModified: entry.lastModified } : {}),
    })
  }

  return Array.from(entries.values())
}
