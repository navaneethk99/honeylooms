import type { Metadata } from 'next'

import type { Media } from '@/payload-types'

import { getMediaUrl } from './getMediaUrl'

export const siteDescription =
  'Explore Honeylooms clothing collections, find your fit, and discover thoughtfully made styles for everyday wear and special occasions.'

/** Keep search and share URLs on the storefront domain, including in preview deployments. */
export const getCanonicalURL = (path = '/') => {
  const configuredURL =
    process.env.DOMAIN_NAME || process.env.NEXT_PUBLIC_SERVER_URL || 'https://honeylooms.in'
  const baseURL = /^https?:\/\//i.test(configuredURL) ? configuredURL : `https://${configuredURL}`

  return new URL(path, new URL(baseURL).origin).toString()
}

export const isSearchIndexable = () =>
  !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production'

export const getDocumentPath = (
  collection: 'pages' | 'products' | 'collections',
  slug?: string | null,
) => {
  if (!slug || (collection === 'pages' && slug === 'home')) return '/'

  const prefix = collection === 'pages' ? '' : `/${collection}`
  return `${prefix}/${encodeURIComponent(slug)}`
}

type PageMetadataArgs = {
  description: string
  image?: Media | string | null
  noIndex?: boolean
  path: string
  title: string
}

export const createPageMetadata = ({
  description,
  image,
  noIndex = false,
  path,
  title,
}: PageMetadataArgs): Metadata => {
  const pageTitle = title.replace(/\s*\|\s*Honeylooms\s*$/i, '').trim()
  const brandedTitle =
    !pageTitle || pageTitle === 'Honeylooms' ? 'Honeylooms' : `${pageTitle} | Honeylooms`
  const url = getCanonicalURL(path)
  const imageURL = typeof image === 'string' ? image : image?.url
  const shareImage = {
    alt: (typeof image === 'object' && image?.alt) || pageTitle || 'Honeylooms',
    url: getCanonicalURL(getMediaUrl(imageURL) || '/logo.png'),
    ...(typeof image === 'object' && image?.width && image?.height
      ? { height: image.height, width: image.width }
      : {}),
  }
  const canIndex = isSearchIndexable() && !noIndex

  return {
    alternates: { canonical: url },
    description,
    openGraph: {
      description,
      images: [shareImage],
      locale: 'en_IN',
      siteName: 'Honeylooms',
      title: brandedTitle,
      type: 'website',
      url,
    },
    robots: {
      follow: isSearchIndexable(),
      index: canIndex,
      googleBot: {
        follow: isSearchIndexable(),
        index: canIndex,
        'max-image-preview': 'large',
      },
    },
    title: { absolute: brandedTitle },
    twitter: {
      card: 'summary_large_image',
      description,
      images: [shareImage],
      title: brandedTitle,
    },
  }
}
