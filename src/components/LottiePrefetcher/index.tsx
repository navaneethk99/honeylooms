'use client'

import { useEffect } from 'react'

export function LottiePrefetcher() {
  useEffect(() => {
    const prefetch = () => {
      // 1. Prefetch the dynamic player JS chunk
      import('@lottiefiles/dotlottie-react').catch((err) => {
        console.warn('Lottie prefetch failed:', err)
      })

      // 2. Fetch the Cat.lottie file to cache it in the browser's HTTP cache
      fetch('/Cat.lottie').catch((err) => {
        console.warn('Lottie asset fetch failed:', err)
      })
    }

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(prefetch)
        } else {
          setTimeout(prefetch, 1000)
        }
      } else {
        const handleLoad = () => {
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(prefetch)
          } else {
            setTimeout(prefetch, 1000)
          }
        }
        window.addEventListener('load', handleLoad)
        return () => window.removeEventListener('load', handleLoad)
      }
    }
  }, [])

  return null
}
