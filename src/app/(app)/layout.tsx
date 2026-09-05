import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header, HeaderFallback } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { defaultTheme } from '@/providers/Theme/shared'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Fraunces } from 'next/font/google'
import localFont from 'next/font/local'
import React from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LottiePrefetcher } from '@/components/LottiePrefetcher'
import { SmoothScroll } from '@/components/SmoothScroll'
import { getCanonicalURL, isSearchIndexable, siteDescription } from '@/utilities/seo'
import './globals.css'

const editorialFont = Fraunces({
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: 'variable',
})

const chopinFont = localFont({
  display: 'swap',
  src: '../../../public/fonts/ChopinScript.ttf',
  variable: '--font-chopin-script',
  weight: '400',
})

const coolveticaFont = localFont({
  display: 'swap',
  src: '../../../public/fonts/Coolvetica Rg.otf',
  variable: '--font-coolvetica-face',
  weight: '400',
})

const dreamOrphanageFont = localFont({
  display: 'swap',
  src: '../../../public/fonts/dream orphanage rg.otf',
  variable: '--font-dream-orphanage-face',
  weight: '400',
})

const rosehotFont = localFont({
  display: 'swap',
  src: '../../../public/fonts/Rosehot.ttf',
  variable: '--font-rosehot-face',
  weight: '400',
})

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalURL()),
  title: {
    default: 'Honeylooms | Handcrafted Indian Fashion',
    template: '%s | Honeylooms',
  },
  description: siteDescription,
  robots: {
    index: isSearchIndexable(),
    follow: isSearchIndexable(),
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Honeylooms',
    title: 'Honeylooms | Handcrafted Indian Fashion',
    description: siteDescription,
    images: [
      {
        url: '/logo.png',
        alt: 'Honeylooms',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={[
        GeistSans.variable,
        GeistMono.variable,
        editorialFont.variable,
        chopinFont.variable,
        coolveticaFont.variable,
        dreamOrphanageFont.variable,
        rosehotFont.variable,
      ]
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
          <React.Suspense fallback={null}>
            <SmoothScroll />
          </React.Suspense>
          <React.Suspense fallback={null}>
            <AdminBar />
          </React.Suspense>
          <LivePreviewListener />
          <LottiePrefetcher />

          <React.Suspense fallback={<HeaderFallback />}>
            <Header />
          </React.Suspense>
          <main className="flex-1 bg-white text-black">{children}</main>
          <React.Suspense fallback={null}>
            <Footer />
          </React.Suspense>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
