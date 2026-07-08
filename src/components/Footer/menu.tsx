import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import React from 'react'

interface Props {
  menu: Footer['navItems']
}

export function FooterMenu({ menu }: Props) {
  if (!menu?.length) return null

  // Chunk items into columns of max 4 rows
  const chunks = []
  for (let i = 0; i < menu.length; i += 4) {
    chunks.push(menu.slice(i, i + 4))
  }

  return (
    <nav className="flex flex-wrap gap-10 md:gap-16">
      {chunks.map((chunk, chunkIndex) => (
        <ul key={chunkIndex} className="flex flex-col gap-1i">
          {chunk.map((item) => {
            return (
              <li key={item.id}>
                <CMSLink appearance="link" {...item.link} />
              </li>
            )
          })}
        </ul>
      ))}
    </nav>
  )
}
