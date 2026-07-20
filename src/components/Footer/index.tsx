import type { Footer as FooterType } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { LogoIcon } from '@/components/icons/logo'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const socialLinks = [
  { href: 'https://www.instagram.com/thehoneylooms/', label: 'Instagram' },
  { href: 'https://x.com/honeylooms', label: 'X / Twitter' },
  { href: 'https://www.linkedin.com/company/honeylooms/', label: 'LinkedIn' },
]

const SocialLinks = () => (
  <div className="min-w-0">
    <h3 className="mb-4 text-[9px] uppercase tracking-[0.22em] text-[#8a6718]">Social</h3>
    <ul className="space-y-2">
      {socialLinks.map((link) => (
        <li key={link.href}>
          <Link
            className="group inline-flex items-center gap-1.5 text-xs text-[#24231f]/60 transition-colors hover:text-[#24231f]"
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

export async function Footer() {
  const footer: FooterType = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#24231f]/15 bg-[#eee8dc] text-[#24231f]">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10 lg:px-14">
        <div className="grid gap-12 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-4">
            <Link className="inline-block" href="/" aria-label="Honeylooms home">
              <LogoIcon className="w-44 md:w-52" />
            </Link>
            <p className="mt-8 max-w-xs font-editorial text-3xl leading-[0.95] tracking-[-0.025em] md:text-4xl">
              Rooted in craft.
              <br />
              Ready for now.
            </p>
            <Link
              className="group mt-7 inline-flex items-center gap-2 border-b border-[#24231f]/30 pb-1 text-[9px] uppercase tracking-[0.2em] transition-colors hover:border-[#24231f]"
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

        <div className="flex flex-col gap-2 border-t border-[#24231f]/15 py-5 text-[9px] uppercase tracking-[0.18em] text-[#24231f]/45 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Honeylooms</p>
          {/*<p>India / Worldwide</p>*/}
        </div>
      </div>
    </footer>
  )
}
