import type { Footer as FooterType } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { ArrowUpRight } from 'lucide-react'
import { cacheLife } from 'next/cache'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'

const socialLinks = [
  { href: 'https://www.instagram.com/thehoneylooms/', label: 'Instagram' },
  { href: 'https://x.com/honeylooms', label: 'X / Twitter' },
  { href: 'https://www.linkedin.com/company/honeylooms/', label: 'LinkedIn' },
]

type FooterTheme = 'blue' | 'brown' | 'navy' | 'pink' | 'red'

const isFooterTheme = (value?: string): value is FooterTheme =>
  value === 'red' || value === 'blue' || value === 'pink' || value === 'navy' || value === 'brown'

const footerThemeClasses: Record<FooterTheme, string> = {
  blue: 'bg-[#1d469f]',
  brown: 'bg-[#9f442f]',
  navy: 'bg-[#24336f]',
  pink: 'bg-[#df4d91]',
  red: 'bg-[#c51c25]',
}

const SocialLinks = () => (
  <div className="min-w-0">
    <h3 className="mb-4 text-[9px] uppercase tracking-[0.22em] text-white/60">Social</h3>
    <ul className="space-y-2">
      {socialLinks.map((link) => (
        <li key={link.href}>
          <Link
            className="group inline-flex items-center gap-1.5 text-xs text-white/65 transition-colors hover:text-white"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
            <ArrowUpRight className="size-2.5 opacity-40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

async function getCurrentYear() {
  'use cache'
  cacheLife('days')

  return new Date().getFullYear()
}

export async function Footer() {
  const [footer, currentYear, cookieStore]: [
    FooterType,
    number,
    Awaited<ReturnType<typeof cookies>>,
  ] = await Promise.all([getCachedGlobal('footer', 1), getCurrentYear(), cookies()])
  const storedTheme = cookieStore.get('honeylooms-theme')?.value
  const footerTheme = isFooterTheme(storedTheme) ? storedTheme : 'navy'
  const menu = footer.navItems || []

  return (
    <footer
      className={`site-footer border-t-4 border-white text-white ${footerThemeClasses[footerTheme]}`}
    >
      <div className="mx-auto max-w-[1500px] px-5 md:px-10 lg:px-14">
        <div className="grid gap-12 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-4">
            <Link className="inline-block" href="/" aria-label="Honeylooms home">
              <Image
                alt="Honeylooms"
                className="h-auto w-44 md:w-52"
                height={393}
                src="/hlms.svg"
                width={1800}
              />
            </Link>
            <p className="mt-8 max-w-xs font-editorial text-3xl leading-[0.95] tracking-[-0.025em] md:text-4xl">
              Rooted in craft.
              <br />
              Ready for now.
            </p>
            <Link
              className="group mt-7 inline-flex items-center gap-2 border-b border-white/30 pb-1 text-[9px] uppercase tracking-[0.2em] transition-colors hover:border-white"
              href="/shop?sort=-createdAt"
            >
              Shop new arrivals
              <ArrowUpRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="md:col-span-7 md:col-start-6 md:pt-1">
            <FooterMenu menu={menu}>
              <SocialLinks />
            </FooterMenu>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/15 py-5 text-[9px] uppercase tracking-[0.18em] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Honeylooms</p>
          {/*<p>India / Worldwide</p>*/}
        </div>
      </div>
    </footer>
  )
}
