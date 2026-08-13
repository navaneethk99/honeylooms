'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { HOMEPAGE_INTRO_COMPLETE_EVENT } from '@/lib/homepageIntro'

import './index.css'

export type MastheadVariant = 'blue' | 'brown' | 'navy' | 'pink' | 'red'

const mastheadVariants = {
  blue: {
    alt: 'Aarna wearing a blue Honeylooms top',
    height: 634,
    src: '/aarna_2.webp',
    width: 322,
  },
  brown: {
    alt: 'Aarna wearing a brown Honeylooms top',
    height: 640,
    src: '/aarna_5.webp',
    width: 387,
  },
  pink: {
    alt: 'Aarna wearing a pink Honeylooms top',
    height: 668,
    src: '/aarna_3.webp',
    width: 367,
  },
  navy: {
    alt: 'Aarna wearing a navy Honeylooms top',
    height: 691,
    src: '/aarna_4.webp',
    width: 397,
  },
  red: {
    alt: 'Aarna wearing Honeylooms',
    height: 1034,
    src: '/aarna.webp',
    width: 591,
  },
} as const

const variantOptions: MastheadVariant[] = ['red', 'blue', 'pink', 'navy', 'brown']
const isDevelopment = process.env.NODE_ENV === 'development'

export function HomepageMasthead({ variant }: { variant: MastheadVariant }) {
  const model = mastheadVariants[variant]
  const router = useRouter()
  const mastheadRef = useRef<HTMLElement>(null)
  const isAnimatingRef = useRef(false)
  const [isWordmarkForeground, setIsWordmarkForeground] = useState(false)
  const [isReversing, setIsReversing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isThemeSwitcherVisible, setIsThemeSwitcherVisible] = useState(true)
  const [modelEntrance, setModelEntrance] = useState<'entering' | 'ready' | 'waiting'>('waiting')

  useEffect(() => {
    const root = document.documentElement

    if (modelEntrance === 'ready') {
      root.classList.remove('homepage-entry-locked')
      return
    }

    root.classList.add('homepage-entry-locked')
    return () => root.classList.remove('homepage-entry-locked')
  }, [modelEntrance])

  useEffect(() => {
    sessionStorage.setItem('honeylooms-theme', variant)
    document.cookie = `honeylooms-theme=${variant}; Path=/; SameSite=Lax`
    router.refresh()
  }, [router, variant])

  useEffect(() => {
    let revealTimer: ReturnType<typeof setTimeout> | undefined

    const revealModel = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (prefersReducedMotion) {
        setModelEntrance('ready')
        return
      }

      revealTimer = setTimeout(() => setModelEntrance('entering'), 180)
    }

    window.addEventListener(HOMEPAGE_INTRO_COMPLETE_EVENT, revealModel, { once: true })
    return () => {
      window.removeEventListener(HOMEPAGE_INTRO_COMPLETE_EVENT, revealModel)
      if (revealTimer) clearTimeout(revealTimer)
    }
  }, [])

  useEffect(() => {
    if (!isDevelopment) return

    const toggleThemeSwitcher = (event: KeyboardEvent) => {
      if (!event.metaKey || !event.shiftKey || event.key.toLowerCase() !== 'h') return

      event.preventDefault()
      setIsThemeSwitcherVisible((isVisible) => !isVisible)
    }

    window.addEventListener('keydown', toggleThemeSwitcher)
    return () => window.removeEventListener('keydown', toggleThemeSwitcher)
  }, [])

  useEffect(() => {
    const masthead = mastheadRef.current
    if (!masthead) return

    const handleWheel = (event: WheelEvent) => {
      const blockScroll = () => {
        event.preventDefault()
        event.stopPropagation()
      }

      if (modelEntrance !== 'ready') {
        blockScroll()
        return
      }

      if (isAnimatingRef.current) {
        blockScroll()
        return
      }

      if (event.deltaY > 0 && !isWordmarkForeground && !isReversing) {
        blockScroll()
        isAnimatingRef.current = true
        setIsWordmarkForeground(true)
        setIsAnimating(true)
        return
      }

      const mastheadTop = masthead.getBoundingClientRect().top
      if (event.deltaY < 0 && mastheadTop >= -4 && isWordmarkForeground && !isReversing) {
        blockScroll()
        isAnimatingRef.current = true
        setIsReversing(true)
        setIsAnimating(true)
      }
    }

    masthead.addEventListener('wheel', handleWheel, { passive: false })
    return () => masthead.removeEventListener('wheel', handleWheel)
  }, [isReversing, isWordmarkForeground, modelEntrance])

  const completeAnimation = (event: AnimationEvent<HTMLHeadingElement>) => {
    if (event.animationName === 'masthead-wordmark-advance') {
      isAnimatingRef.current = false
      setIsAnimating(false)
      return
    }

    if (event.animationName !== 'masthead-wordmark-retreat' || !isReversing) return

    setIsWordmarkForeground(false)
    setIsReversing(false)
    isAnimatingRef.current = false
    setIsAnimating(false)
  }

  const completeModelEntrance = (event: AnimationEvent<HTMLImageElement>) => {
    if (event.animationName === 'masthead-model-enter') setModelEntrance('ready')
  }

  return (
    <section
      ref={mastheadRef}
      data-lenis-prevent-wheel={isAnimating || modelEntrance !== 'ready' ? '' : undefined}
      className={`homepage-masthead homepage-masthead--${variant} ${
        isWordmarkForeground ? 'homepage-masthead--wordmark-foreground' : ''
      } ${isReversing ? 'homepage-masthead--wordmark-reversing' : ''}`}
    >
      <h1 onAnimationEnd={completeAnimation}>HONEYLOOMS</h1>
      {isDevelopment && isThemeSwitcherVisible ? (
        <div className="absolute right-4 top-4 z-10 flex overflow-hidden border border-white/50 bg-black/25 text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-sm md:right-6 md:top-6">
          {variantOptions.map((option) => (
            <button
              className={`px-2.5 py-2 transition-colors hover:bg-white/20 ${
                option === variant ? 'bg-white text-[#24231f]' : ''
              }`}
              key={option}
              onClick={() => router.replace(`/?theme=${option}`, { scroll: false })}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      <Image
        alt={model.alt}
        className={`homepage-masthead__model homepage-masthead__model--${modelEntrance}`}
        height={model.height}
        onAnimationEnd={completeModelEntrance}
        priority
        sizes="(max-width: 767px) 68vw, 44vw"
        src={model.src}
        width={model.width}
      />
    </section>
  )
}
