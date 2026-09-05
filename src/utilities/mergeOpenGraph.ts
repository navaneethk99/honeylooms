import type { Metadata } from 'next'
import { getCanonicalURL, siteDescription } from './seo'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  siteName: 'Honeylooms',
  title: 'Honeylooms | Handcrafted Indian Fashion',
  description: siteDescription,
  images: [
    {
      url: getCanonicalURL('/logo.png'),
      alt: 'Honeylooms',
    },
  ],
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
