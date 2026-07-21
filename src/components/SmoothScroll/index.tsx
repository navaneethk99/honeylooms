'use client'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export const SmoothScroll = () => {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)
  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchPrimary = window.matchMedia('(pointer: coarse)')

    if (reducedMotion.matches || touchPrimary.matches) return

    const lenis = new Lenis({
      anchors: true,
      autoRaf: true,
      duration: 1.1,
      easing: (progress) => Math.min(1, 1.001 - Math.pow(2, -10 * progress)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
    })

    lenisRef.current = lenis

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    const previousPathname = previousPathnameRef.current
    previousPathnameRef.current = pathname

    if (previousPathname === pathname) return

    lenisRef.current?.scrollTo(0, { force: true, immediate: true })
  }, [pathname])

  return null
}
