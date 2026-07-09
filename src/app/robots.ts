import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

/* eslint-disable no-restricted-exports */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerSideURL()

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
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
