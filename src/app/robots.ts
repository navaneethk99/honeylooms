import type { MetadataRoute } from 'next'

import { getCanonicalURL, isSearchIndexable } from '@/utilities/seo'

/* eslint-disable no-restricted-exports */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalURL().replace(/\/$/, '')

  return {
    host: baseUrl,
    rules: [
      {
        allow: '/',
        disallow: [
          '/account',
          '/account/',
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/checkout',
          '/checkout/',
          '/create-account',
          '/find-order',
          '/forgot-password',
          '/login',
          '/logout',
          '/next',
          '/next/',
          '/orders',
          '/orders/',
        ],
        userAgent: '*',
      },
    ],
    // Preview pages remain crawlable so crawlers can see their noindex metadata.
    ...(isSearchIndexable() ? { sitemap: getCanonicalURL('/sitemap.xml') } : {}),
  }
}
