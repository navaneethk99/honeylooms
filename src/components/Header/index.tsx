import { getCachedGlobal } from '@/utilities/getGlobals'
import Image from 'next/image'
import Link from 'next/link'

import './index.css'
import { HeaderClient } from './index.client'
import { PromoBanner } from './PromoBanner'

export function HeaderFallback() {
  return (
    <header className="site-header relative z-20" aria-busy="true">
      <nav aria-label="Main navigation" className="header-shell">
        <div className="header-mobile-menu md:hidden" />
        <Link aria-label="Honeylooms home" className="header-brand" href="/">
          <Image
            alt="Honeylooms"
            className="header-logo"
            height={75}
            priority
            src="/logo.svg"
            width={1000}
          />
        </Link>
        <div className="header-primary-nav" />
        <div className="header-actions">
          <span className="size-8 animate-pulse bg-black/5" />
          <span className="size-8 animate-pulse bg-black/5" />
        </div>
      </nav>
    </header>
  )
}

export async function Header() {
  const promoBannerPromise = getCachedGlobal('promo-banner', 1).catch((error) => {
    console.warn(
      'Promo banner unavailable; rendering the header without it.',
      error instanceof Error ? error.message : error,
    )
    return null
  })

  const [header, promoBanner] = await Promise.all([
    getCachedGlobal('header', 1),
    promoBannerPromise,
  ])

  return (
    <>
      <HeaderClient header={header} />
      <PromoBanner promoBanner={promoBanner} />
    </>
  )
}
