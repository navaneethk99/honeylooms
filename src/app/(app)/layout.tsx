import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { ensureStartsWith } from '@/utilities/ensureStartsWith'
import { Providers } from '@/providers'
import { defaultTheme } from '@/providers/Theme/shared'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Fraunces } from 'next/font/google'
import React from 'react'
import { Analytics } from '@vercel/analytics/next'
import { LottiePrefetcher } from '@/components/LottiePrefetcher'
import { SmoothScroll } from '@/components/SmoothScroll'
import './globals.css'

const editorialFont = Fraunces({
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: 'variable',
})

/* const { SITE_NAME, TWITTER_CREATOR, TWITTER_SITE } = process.env
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000'
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined
 */
/* export const metadata = {
  metadataBase: new URL(baseUrl),
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: 'summary_large_image',
        creator: twitterCreator,
        site: twitterSite,
      },
    }),
} */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://honeylooms.in'),
  title: {
    default: 'Honeylooms | Handcrafted Indian Fashion',
    template: '%s | Honeylooms',
  },
  description:
    'Discover handcrafted Indian clothing that blends timeless craftsmanship with contemporary style.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://honeylooms.in',
    siteName: 'Honeylooms',
    title: 'Honeylooms | Handcrafted Indian Fashion',
    description:
      'Discover handcrafted Indian clothing that blends timeless craftsmanship with contemporary style.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Honeylooms',
      },
    ],
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={[GeistSans.variable, GeistMono.variable, editorialFont.variable]
        .filter(Boolean)
        .join(' ')}
      data-scroll-behavior="smooth"
      data-theme={defaultTheme}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link rel="preload" href="/Cat.lottie" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          <SmoothScroll />
          <AdminBar />
          <LivePreviewListener />
          <LottiePrefetcher />

          <Header />
          <main className="flex-1 bg-[#f5f1e8] text-black">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
