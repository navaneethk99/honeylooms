import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import { cacheLife, cacheTag } from 'next/cache'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

const staticRoutes = [
  '',
  '/about-us',
  '/careers',
  '/collections',
  '/deliveries-and-returns',
  '/disclaimer',
  '/shop',
  '/sizing',
  '/terms-and-conditions',
]

const normalizeURL = (baseUrl: string, path: string) => `${baseUrl}${path}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('hours')
  cacheTag('pages', 'products', 'collections')

  const baseUrl = getServerSideURL()
  const payload = await getPayload({ config: configPromise })

  const [pages, products, collections] = await Promise.all([
    payload.find({
      collection: 'pages',
      draft: false,
      limit: 1000,
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
      draft: false,
      limit: 1000,
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
      collection: 'collections',
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
  ])

  const staticEntries = staticRoutes.map((route) => ({
    changeFrequency: route === '' || route === '/shop' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : route === '/shop' ? 0.9 : 0.7,
    url: normalizeURL(baseUrl, route),
  })) satisfies MetadataRoute.Sitemap

  const pageEntries = pages.docs
    .filter((page) => page.slug && page.slug !== 'home')
    .map((page) => ({
      changeFrequency: 'monthly',
      lastModified: page.updatedAt,
      priority: 0.7,
      url: normalizeURL(baseUrl, `/${page.slug}`),
    })) satisfies MetadataRoute.Sitemap

  const productEntries = products.docs
    .filter((product) => product.slug)
    .map((product) => ({
      changeFrequency: 'weekly',
      lastModified: product.updatedAt,
      priority: 0.8,
      url: normalizeURL(baseUrl, `/products/${product.slug}`),
    })) satisfies MetadataRoute.Sitemap

  const collectionEntries = collections.docs
    .filter((collection) => collection.slug)
    .map((collection) => ({
      changeFrequency: 'weekly',
      lastModified: collection.updatedAt,
      priority: 0.8,
      url: normalizeURL(baseUrl, `/collections/${collection.slug}`),
    })) satisfies MetadataRoute.Sitemap

  return [...staticEntries, ...pageEntries, ...productEntries, ...collectionEntries]
}
