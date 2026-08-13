'use client'

import { useEffect, useState } from 'react'

import styles from './index.module.css'

function Intro({ isExiting = false }: { isExiting?: boolean }) {
  return (
    <div
      aria-label="Honeylooms homepage is loading"
      aria-live="polite"
      className={`${styles.intro} ${isExiting ? styles.introExiting : ''} fixed inset-0 z-[9999] flex min-h-svh items-center justify-center overflow-hidden bg-[#201d19] px-2 text-[#fff4e6]`}
      role="status"
    >
      <span
        aria-hidden="true"
        className={`${styles.wordmark} select-none font-sans text-[clamp(3.25rem,14.5vw,15rem)] font-black leading-[0.78] tracking-[-0.09em]`}
      >
        HONEYLOOMS
      </span>
    </div>
  )
}

export function HomepageIntro() {
  return <Intro />
}

export function HomepageIntroFadeOut() {
  const [isExiting, setIsExiting] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | undefined

    const fadeOut = () => {
      requestAnimationFrame(() => setIsExiting(true))
      fadeTimer = setTimeout(() => setIsVisible(false), 850)
    }

    if (document.readyState === 'complete') {
      fadeOut()
    } else {
      window.addEventListener('load', fadeOut, { once: true })
    }

    return () => {
      window.removeEventListener('load', fadeOut)
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [])

  return isVisible ? <Intro isExiting={isExiting} /> : null
}
