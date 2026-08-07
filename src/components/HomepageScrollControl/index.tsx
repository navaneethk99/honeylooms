'use client'

import { ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'

const SCROLL_THRESHOLD = 80

export function HomepageScrollControl() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateDirection = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD)

    updateDirection()
    window.addEventListener('scroll', updateDirection, { passive: true })

    return () => window.removeEventListener('scroll', updateDirection)
  }, [])

  return (
    <a
      aria-label={isScrolled ? 'Back to top' : 'Scroll to latest arrivals'}
      className={`fixed bottom-9 right-5 z-40 flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-[color,background-color,border-color] duration-300 md:bottom-12 md:right-10 lg:right-14 ${
        isScrolled
          ? 'border-[#24231f]/25 bg-white/90 text-[#24231f] hover:bg-[#24231f] hover:text-white'
          : 'border-white/40 bg-black/10 text-white hover:bg-white hover:text-[#24231f]'
      }`}
      href={isScrolled ? '#top' : '#latest-arrivals'}
    >
      <ArrowDown
        className={`size-4 transition-transform duration-500 ease-out ${
          isScrolled ? 'rotate-180' : ''
        }`}
      />
    </a>
  )
}
