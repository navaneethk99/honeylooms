'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'

export const SmoothScroll = () => {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchPrimary = window.matchMedia('(pointer: coarse)')

    if (reducedMotion.matches || touchPrimary.matches) return

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.1,
      easing: (progress) => Math.min(1, 1.001 - Math.pow(2, -10 * progress)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
    })

    return () => lenis.destroy()
  }, [])

  return null
}
