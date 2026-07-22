'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type Props = {
  className?: string
}

export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname()

  const links = [
    { href: '/account', label: 'Account settings' },
    { href: '/account/addresses', label: 'Addresses' },
    { href: '/orders', label: 'Orders' },
  ]

  return (
    <div className={clsx('w-full', className)}>
      <nav aria-label="Account navigation">
        <ul className="flex gap-5 overflow-x-auto border-b border-[#24231f]/20 pb-4 md:flex-col md:gap-3 md:overflow-visible md:border-0 md:pb-0">
          {links.map((link) => {
            const active =
              pathname === link.href || (link.href !== '/account' && pathname.startsWith(link.href))
            return (
              <li key={link.href} className="flex shrink-0 text-sm">
                <Link
                  aria-current={active ? 'page' : undefined}
                  href={link.href}
                  className={clsx(
                    'w-full whitespace-nowrap text-[#6c675d] transition-colors hover:text-[#24231f]',
                    {
                      'font-medium text-[#24231f]': active,
                    },
                  )}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
          <li className="flex shrink-0 text-sm md:mt-3">
            <Link
              href="/logout"
              className="w-full whitespace-nowrap text-[#6c675d] transition-colors hover:text-[#24231f]"
            >
              Log out
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
