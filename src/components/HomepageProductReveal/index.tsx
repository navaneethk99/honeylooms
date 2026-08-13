'use client'

import { Children, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import styles from './index.module.css'

export function HomepageProductReveal({ children }: { children: ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current

    if (!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-reveal-item]'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = entry.target as HTMLElement

          if (entry.isIntersecting) {
            item.dataset.reveal = 'visible'
            return
          }

          // Reset only when the card is below the viewport. Cards that leave
          // through the top stay visible while the visitor continues downward.
          if (entry.boundingClientRect.top > 0) item.dataset.reveal = 'pending'
        })
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.12,
      },
    )

    items.forEach((item) => {
      // Avoid animating cards already visible when restoring a scroll position.
      item.dataset.reveal =
        item.getBoundingClientRect().top < window.innerHeight * 0.98 ? 'visible' : 'pending'
      observer.observe(item)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-y-14"
      ref={gridRef}
    >
      {Children.map(children, (child) => (
        <div className={styles.item} data-reveal-item>
          {child}
        </div>
      ))}
    </div>
  )
}
