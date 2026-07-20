'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import { SearchModal } from '@/components/Search'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  return (
    <header className="site-header relative z-20">
      <nav aria-label="Main navigation" className="header-shell">
        <div className="header-mobile-menu md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>

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

        {menu.length ? (
          <ul className="header-primary-nav">
            {menu.map((item) => (
              <li key={item.id}>
                <CMSLink
                  {...item.link}
                  appearance="nav"
                  className={cn('navLink', {
                    active:
                      item.link.url && item.link.url !== '/'
                        ? pathname.includes(item.link.url)
                        : false,
                  })}
                  size="clear"
                />
              </li>
            ))}
          </ul>
        ) : null}

        <div className="header-actions">
          <SearchModal />
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
        </div>
      </nav>
    </header>
  )
}
