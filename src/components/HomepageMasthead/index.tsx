'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent, PointerEvent } from 'react'
import Image from 'next/image'

import './index.css'

export type MastheadVariant = 'blue' | 'red'

const mastheadVariants = {
  blue: {
    alt: 'Aarna wearing a blue Honeylooms top',
    height: 634,
    src: '/aarna_2.png',
    width: 322,
  },
  red: {
    alt: 'Aarna wearing Honeylooms',
    height: 1034,
    src: '/aarna.png',
    width: 591,
  },
} as const

export function HomepageMasthead({ variant }: { variant: MastheadVariant }) {
  const model = mastheadVariants[variant]
  const mastheadRef = useRef<HTMLElement>(null)
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  const isAnimatingRef = useRef(false)
  const [isWordmarkForeground, setIsWordmarkForeground] = useState(false)
  const [isReversing, setIsReversing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

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
