'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent, PointerEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import './index.css'

export type MastheadVariant = 'blue' | 'navy' | 'pink' | 'red'

const mastheadVariants = {
  blue: {
    alt: 'Aarna wearing a blue Honeylooms top',
    height: 634,
    src: '/aarna_2.webp',
    width: 322,
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

const variantOptions: MastheadVariant[] = ['red', 'blue', 'pink', 'navy']
const isDevelopment = process.env.NODE_ENV === 'development'

export function HomepageMasthead({ variant }: { variant: MastheadVariant }) {
  const model = mastheadVariants[variant]
  const router = useRouter()
  const mastheadRef = useRef<HTMLElement>(null)
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  const isAnimatingRef = useRef(false)
  const [isWordmarkForeground, setIsWordmarkForeground] = useState(false)
  const [isReversing, setIsReversing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isThemeSwitcherVisible, setIsThemeSwitcherVisible] = useState(true)

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
  }, [isReversing, isWordmarkForeground])

  const updateCursorPosition = (event: PointerEvent<HTMLElement>) => {
    const wordmarkBounds = wordmarkRef.current?.getBoundingClientRect()
    if (wordmarkBounds) {
      wordmarkRef.current?.style.setProperty(
        '--glitch-x',
        `${event.clientX - wordmarkBounds.left}px`,
      )
      wordmarkRef.current?.style.setProperty(
        '--glitch-y',
        `${event.clientY - wordmarkBounds.top}px`,
      )
    }
  }

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

  return (
    <section
      ref={mastheadRef}
      data-lenis-prevent-wheel={isAnimating ? '' : undefined}
      className={`homepage-masthead homepage-masthead--${variant} ${
        isWordmarkForeground ? 'homepage-masthead--wordmark-foreground' : ''
      } ${isReversing ? 'homepage-masthead--wordmark-reversing' : ''}`}
      onPointerEnter={updateCursorPosition}
      onPointerMove={updateCursorPosition}
    >
      <h1 ref={wordmarkRef} data-text="HONEYLOOMS" onAnimationEnd={completeAnimation}>
        HONEYLOOMS
      </h1>
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
        className="homepage-masthead__model"
        height={model.height}
        priority
        sizes="(max-width: 767px) 68vw, 44vw"
        src={model.src}
        width={model.width}
      />
    </section>
  )
}
