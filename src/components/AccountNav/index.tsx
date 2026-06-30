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
    <div className={clsx(className)}>
      <nav>
        <h3 className="text-xs mb-3 text-neutral-500 dark:text-neutral-400">Account</h3>
        <ul className="flex flex-col gap-2">
          {links.map((link) => {
            const active =
              pathname === link.href || (link.href !== '/account' && pathname.startsWith(link.href))
            const DynamicTag = active ? 'p' : Link
            return (
              <li key={link.href} className="flex text-sm text-black dark:text-white">
                <DynamicTag
                  href={link.href}
                  className={clsx(
                    'w-full hover:underline hover:underline-offset-4 transition-all duration-200',
                    {
                      'underline underline-offset-4 font-medium': active,
                    },
                  )}
                >
                  {link.label}
                </DynamicTag>
              </li>
            )
          })}
          <li className="mt-4 border-t border-neutral-100 dark:border-neutral-900 pt-4 flex text-sm text-neutral-500 dark:text-neutral-400">
            <Link
              href="/logout"
              className="w-full hover:underline hover:underline-offset-4 transition-all duration-200"
            >
              Log out
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
