import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  url: 'https://honeylooms.in',
  siteName: 'Honeylooms',
  title: 'Honeylooms | Handcrafted Indian Fashion',
  description:
    'Discover handcrafted Indian clothing that blends timeless craftsmanship with contemporary style. Made with premium fabrics and designed to last.',
  images: [
    {
      url: '/logo.svg',
      width: 1200,
      height: 630,
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
