import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import React from 'react'
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  menu: Footer['navItems']
}

export function FooterMenu({ children, menu }: Props) {
  // Chunk items into columns of max 4 rows
  const chunks = []
  for (let i = 0; i < (menu?.length ?? 0); i += 4) {
    chunks.push(menu.slice(i, i + 4))
  }

  return (
    <nav className="grid grid-cols-2 gap-x-8 gap-y-10 md:flex md:flex-wrap md:gap-16">
      {chunks.map((chunk, chunkIndex) => {
        let title = null
        if (chunkIndex === 0) {
          title = 'Policies'
        } else if (chunkIndex === 1) {
          title = 'Useful Links'
        } else if (chunkIndex === 2) {
          title = 'Collections'
        }

        return (
          <div key={chunkIndex} className="flex flex-col gap-3">
            {title && (
              <h3 className="font-semibold text-[#D9A322] underline text-md tracking-wide">
                {title}
              </h3>
            )}
            <ul className="flex flex-col gap-0">
              {chunk.map((item) => {
                return (
                  <li key={item.id}>
                    <CMSLink appearance="link" {...item.link} />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      {children}
    </nav>
  )
}
