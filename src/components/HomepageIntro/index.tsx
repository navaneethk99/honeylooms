'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

import type { MastheadVariant } from '@/components/HomepageMasthead'
import { HOMEPAGE_INTRO_COMPLETE_EVENT } from '@/lib/homepageIntro'

import styles from './index.module.css'

const variantClasses: Record<MastheadVariant, string> = {
  blue: 'bg-[radial-gradient(circle_at_50%_42%,#4178dc_0%,#1d469f_42%,#081b52_100%)]',
  brown: 'bg-[radial-gradient(circle_at_50%_42%,#cf7458_0%,#9f442f_42%,#5e2419_100%)]',
  navy: 'bg-[radial-gradient(circle_at_50%_42%,#485aa2_0%,#24336f_42%,#0d173f_100%)]',
  pink: 'bg-[radial-gradient(circle_at_50%_42%,#ff9dcc_0%,#df4d91_42%,#941d50_100%)]',
  red: 'bg-[radial-gradient(circle_at_50%_42%,#ef4b43_0%,#c51c25_38%,#78121b_100%)]',
}

type IntroProps = {
  motion?: WordmarkMotion
  phase?: 'idle' | 'moving' | 'fading'
  variant: MastheadVariant
  wordmarkRef?: RefObject<HTMLSpanElement | null>
}

type WordmarkMotion = {
  scale: number
  x: number
  y: number
}

function Intro({ motion, phase = 'idle', variant, wordmarkRef }: IntroProps) {
  const motionStyles = motion
    ? ({
        '--intro-scale': motion.scale,
        '--intro-x': `${motion.x}px`,
        '--intro-y': `${motion.y}px`,
      } as CSSProperties)
    : undefined

  return (
    <div
      aria-label="Honeylooms homepage is loading"
      aria-live="polite"
      className={`${styles.intro} ${phase === 'moving' ? styles.introMoving : ''} ${phase === 'fading' ? styles.introFading : ''} fixed inset-0 z-[9999] flex min-h-svh touch-none items-center justify-center overflow-hidden px-2 text-[#fff4e6]`}
      data-lenis-prevent-wheel
      role="status"
    >
      <span aria-hidden="true" className={`${styles.backdrop} ${variantClasses[variant]}`} />
      <span className={styles.wordmarkMover} ref={wordmarkRef} style={motionStyles}>
        <span
          aria-hidden="true"
          className={`${styles.wordmark} select-none font-sans text-[clamp(3.25rem,14.5vw,15rem)] font-black leading-[0.78] tracking-[-0.09em]`}
        >
          HONEYLOOMS
        </span>
      </span>
    </div>
  )
}

export function HomepageIntro({ variant }: { variant: MastheadVariant }) {
  return <Intro variant={variant} />
}

export function HomepageIntroFadeOut({ variant }: { variant: MastheadVariant }) {
  const wordmarkRef = useRef<HTMLSpanElement>(null)
  const [motion, setMotion] = useState<WordmarkMotion>()
  const [phase, setPhase] = useState<IntroProps['phase']>('idle')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = []
    let animationFrame: number | undefined

    const completeIntro = () => {
      setIsVisible(false)
      window.dispatchEvent(new Event(HOMEPAGE_INTRO_COMPLETE_EVENT))
    }

    const fadeOut = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timers.push(setTimeout(completeIntro, 0))
        return
      }

      const source = wordmarkRef.current?.getBoundingClientRect()
      const targetWordmark = document.querySelector<HTMLElement>('.homepage-masthead h1')
      const targetRange = document.createRange()

      if (targetWordmark) targetRange.selectNodeContents(targetWordmark)
      const target = targetWordmark ? targetRange.getBoundingClientRect() : undefined

      if (!source || !target) {
        setPhase('fading')
        timers.push(setTimeout(completeIntro, 520))
        return
      }

      setMotion({
        scale: target.width / source.width,
        x: target.left + target.width / 2 - (source.left + source.width / 2),
        y: target.top + target.height / 2 - (source.top + source.height / 2),
      })

      animationFrame = requestAnimationFrame(() => {
        setPhase('moving')
        timers.push(setTimeout(() => setPhase('fading'), 760))
        timers.push(setTimeout(completeIntro, 1280))
      })
    }

    if (document.readyState === 'complete') {
      fadeOut()
    } else {
      window.addEventListener('load', fadeOut, { once: true })
    }

    return () => {
      window.removeEventListener('load', fadeOut)
      if (animationFrame) cancelAnimationFrame(animationFrame)
      timers.forEach(clearTimeout)
    }
  }, [])

  return isVisible ? (
    <Intro motion={motion} phase={phase} variant={variant} wordmarkRef={wordmarkRef} />
  ) : null
}
