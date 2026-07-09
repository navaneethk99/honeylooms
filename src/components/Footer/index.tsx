import type { Footer } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { LogoIcon } from '@/components/icons/logo'

const { COMPANY_NAME, SITE_NAME } = process.env
const socialLinks = [
  {
    href: 'https://www.instagram.com/thehoneylooms/',
    icon: (
      <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
        <rect height="18" rx="5" stroke="currentColor" strokeWidth="2" width="18" x="3" y="3" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" fill="currentColor" r="1.25" />
      </svg>
    ),
    label: 'Instagram',
  },
  {
    href: 'https://x.com/honeylooms',
    icon: (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13.9 10.5 21.3 2h-1.8l-6.4 7.4L8 2H2l7.8 11.4L2 22h1.8l6.8-7.8 5.4 7.8h6zM11.5 13.2l-.8-1.1L4.4 3.3h2.7l5 7 .8 1.1 6.6 9.3h-2.7z" />
      </svg>
    ),
    label: 'X (Twitter)',
  },
  {
    href: 'https://www.linkedin.com/company/honeylooms/',
    icon: (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5zM3 9.75h4v10.75H3zM9.25 9.75h3.84v1.47h.05c.54-.96 1.85-1.74 3.56-1.74 3.8 0 4.3 2.31 4.3 5.32v5.7h-4v-5.06c0-1.34-.03-3.06-1.98-3.06-1.98 0-2.27 1.46-2.27 2.96v5.16h-4z" />
      </svg>
    ),
    label: 'LinkedIn',
  },
]

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []
  const currentYear = new Date().getFullYear()
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : '')
  const skeleton = 'w-full h-6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700'

  const copyrightName = COMPANY_NAME || SITE_NAME || ''

  return (
    <footer className="text-sm text-neutral-500 dark:text-neutral-400">
      <div className="container">
        <div className="flex w-full flex-col gap-6 border-t border-neutral-200 py-8 text-sm md:flex-row md:gap-12 dark:border-neutral-700">
          <div>
            <Link className="flex items-center gap-2 text-black md:pt-1 dark:text-white" href="/">
              <LogoIcon className="w-45 h-auto" />
              <span className="sr-only">{SITE_NAME}</span>
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="flex flex-wrap gap-10 md:gap-16">
                <div className="flex w-[120px] flex-col gap-1.5">
                  <div className={skeleton} />
                  <div className={skeleton} />
                  <div className={skeleton} />
                  <div className={skeleton} />
                </div>
                <div className="flex w-[120px] flex-col gap-1.5">
                  <div className={skeleton} />
                  <div className={skeleton} />
                </div>
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>
          <div className="flex flex-col gap-3">
            <h3 className="text-md font-semibold tracking-wide text-[#D9A322] underline">
              Social Media
            </h3>
            <ul className="flex flex-col gap-0">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="inline-flex font-medium items-center gap-2 text-black hover:underline dark:text-white"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="container mx-auto flex w-full flex-col items-center gap-1 md:flex-row md:gap-0">
          {/*<p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>*/}
          {/*<hr className="mx-4 hidden h-4 w-px border-l border-neutral-400 md:inline-block" />*/}
          {/*<p>Designed in Michigan</p>*/}
          <p className="md:ml-auto"></p>
        </div>
      </div>
    </footer>
  )
}
