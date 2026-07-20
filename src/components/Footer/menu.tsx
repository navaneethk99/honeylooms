import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
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

  return (
    <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-7 gap-y-9 sm:grid-cols-4">
      {chunks.map((chunk, chunkIndex) => (
        <div className="min-w-0" key={chunkIndex}>
          <h3 className="mb-4 text-[9px] uppercase tracking-[0.22em] text-[#8a6718]">
            {columnTitles[chunkIndex] || `More ${chunkIndex + 1}`}
          </h3>
          <ul className="space-y-2">
            {chunk.map((item) => (
              <li key={item.id}>
                <CMSLink
                  appearance="link"
                  {...item.link}
                  className="h-auto justify-start p-0 text-left text-xs font-normal text-[#24231f]/60 no-underline transition-colors hover:text-[#24231f] hover:no-underline"
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {children}
    </nav>
  )
}
