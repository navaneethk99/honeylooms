import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  menu: Footer['navItems']
}

const columnTitles = ['Information', 'Explore', 'Collections']

export function FooterMenu({ children, menu }: Props) {
  const items = menu ?? []
  const chunks = []

  for (let index = 0; index < items.length; index += 4) {
    chunks.push(items.slice(index, index + 4))
  }

  if (chunks.length === 0) chunks.push([])

  return (
    <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-7 gap-y-6 sm:grid-cols-4">
      {chunks.map((chunk, chunkIndex) => (
        <div className="min-w-0" key={chunkIndex}>
          <h3 className="mb-3 text-[9px] uppercase tracking-[0.22em] text-white/60">
            {columnTitles[chunkIndex] || `More ${chunkIndex + 1}`}
          </h3>
          <ul className="space-y-1.5">
            {chunk.map((item) => (
              <li key={item.id}>
                {item.link?.url === '/collections' ? (
                  <Link
                    className="text-xs font-normal text-white/65 transition-colors hover:text-white"
                    href="/find-order"
                  >
                    Track order
                  </Link>
                ) : (
                  <CMSLink
                    appearance="link"
                    {...item.link}
                    className="h-auto justify-start p-0 text-left text-xs font-normal text-white/65 no-underline transition-colors hover:text-white hover:no-underline"
                  />
                )}
              </li>
            ))}
            {/*{chunkIndex === 0 && !hasCareersLink && (
              <li>
                <Link
                  className="text-xs font-normal text-[#24231f]/60 transition-colors hover:text-[#24231f]"
                  href="/careers"
                >
                  Careers
                </Link>
              </li>
            )}*/}
          </ul>
        </div>
      ))}
      {children}
    </nav>
  )
}
