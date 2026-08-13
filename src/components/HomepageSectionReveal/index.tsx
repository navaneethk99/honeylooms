'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import styles from './index.module.css'

type Props = {
  children: ReactNode
  motion: 'collections' | 'reels'
}

export function HomepageSectionReveal({ children, motion }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current

    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    section.dataset.reveal =
      section.getBoundingClientRect().top < window.innerHeight * 0.98 ? 'visible' : 'pending'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        if (entry.isIntersecting) {
          section.dataset.reveal = 'visible'
          return
        }

        if (entry.boundingClientRect.top > 0) section.dataset.reveal = 'pending'
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.1,
      },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`${styles.root} mx-auto max-w-[1500px]`}
      data-motion={motion}
      ref={sectionRef}
    >
      {children}
    </div>
  )
}
