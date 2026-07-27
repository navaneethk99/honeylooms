'use client'

import React, { useEffect, useRef } from 'react'

import styles from './index.module.css'

type Props = {
  children: React.ReactNode
}

export function ShopProductReveal({ children }: Props) {
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const item = itemRef.current

    if (
      !item ||
      !window.matchMedia('(max-width: 47.999rem)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // Keep initially visible products steady; reveal only cards reached by scrolling.
    if (item.getBoundingClientRect().top < window.innerHeight * 0.98) {
      return
    }

    item.dataset.reveal = 'pending'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        if (entry.isIntersecting) {
          item.dataset.reveal = 'visible'
          return
        }

        // Reset after the card moves below the viewport so the next downward
        // scroll plays the entrance again. Cards leaving above stay visible.
        if (entry.boundingClientRect.top > 0) {
          item.dataset.reveal = 'pending'
        }
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.08,
      },
    )

    observer.observe(item)

    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.item} ref={itemRef}>
      {children}
    </div>
  )
}
