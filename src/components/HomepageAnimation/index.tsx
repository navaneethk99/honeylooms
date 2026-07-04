'use client'

import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import type { Product } from '@/payload-types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = {
  products: Product[]
}

export function HomepageAnimation({ products }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  // State to track window width to handle responsive rebuilds
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    setWindowWidth(window.innerWidth)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Ensure we have exactly 6 outfits to display
  const outfits = React.useMemo(() => {
    const list = [...products]
    while (list.length < 6 && list.length > 0) {
      list.push(...products)
    }
    return list.slice(0, 6)
  }, [products])

  // Generate honeycomb hexagon positions to fill the screen
  const hexagons = React.useMemo(() => {
    const list = []
    const spacingX = 75
    const spacingY = 86.6

    for (let r = -7; r <= 7; r++) {
      for (let c = -12; c <= 12; c++) {
        const x = c * spacingX
        const yOffset = c % 2 === 0 ? spacingY * 0.5 : 0
        const y = r * spacingY + yOffset

        const randomX = Math.random() * 1400 - 700
        const randomY = Math.random() * 1400 - 700
        const randomRot = Math.random() * 360 - 180
        const randomScale = Math.random() * 0.4 + 0.1

        list.push({
          id: `${r}-${c}`,
          x,
          y,
          randomX,
          randomY,
          randomRot,
          randomScale,
        })
      }
    }
    return list
  }, [])

  const isMobile = windowWidth > 0 && windowWidth < 768

  useEffect(() => {
    if (!containerRef.current || !stickyRef.current || outfits.length === 0 || isMobile) return

    const mm = gsap.matchMedia(containerRef)

    mm.add(
      {
        isDesktop: '(min-width: 1280px)',
        isTablet: '(min-width: 768px) and (max-width: 1279px)',
      },
      (context) => {
        const { isDesktop } = context.conditions as { isDesktop: boolean }

        const styles = isDesktop
          ? [
              { left: '4vw', top: '8vh', bottom: 'auto', right: 'auto' },
              { left: '18vw', top: '36vh', bottom: 'auto', right: 'auto' },
              { left: '4vw', top: 'auto', right: 'auto', bottom: '8vh' },
              { left: 'auto', top: '8vh', right: '4vw', bottom: 'auto' },
              { left: 'auto', top: '36vh', right: '18vw', bottom: 'auto' },
              { left: 'auto', top: 'auto', right: '4vw', bottom: '8vh' },
            ]
          : [
              { left: '4vw', top: '8vh', bottom: 'auto', right: 'auto' },
              { left: '20vw', top: '36vh', bottom: 'auto', right: 'auto' }, // hidden by CSS
              { left: '4vw', top: 'auto', right: 'auto', bottom: '8vh' },
              { left: 'auto', top: '8vh', right: '4vw', bottom: 'auto' },
              { left: 'auto', top: '36vh', right: '20vw', bottom: 'auto' }, // hidden by CSS
              { left: 'auto', top: 'auto', right: '4vw', bottom: '8vh' },
            ]

        // Initialize card positions off-screen
        cardsRef.current.forEach((card, index) => {
          if (!card) return
          const isLeft = index < 3
          const startX = isLeft ? '-100vw' : '100vw'
          const startY = isLeft ? (index % 3) * 150 - 150 : ((index - 3) % 3) * 150 - 150
          const pos = styles[index]
          gsap.set(card, {
            x: startX,
            y: startY,
            opacity: 0,
            scale: 0.6,
            rotation: isLeft ? -45 : 45,
            left: pos?.left || 'auto',
            top: pos?.top || 'auto',
            right: pos?.right || 'auto',
            bottom: pos?.bottom || 'auto',
          })
        })

        // Initialize title opacity and scale
        gsap.set(titleRef.current, {
          opacity: 0,
          scale: 0.8,
        })

        // Establish ScrollTrigger timeline
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            pin: stickyRef.current,
            pinSpacing: true,
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        })

        // 1. Fade out scroll indicator
        tl.to(
          scrollIndicatorRef.current,
          {
            opacity: 0,
            y: -20,
            pointerEvents: 'none',
            duration: 0.8,
          },
          0,
        )

        // Disintegrate Honeycomb hexagons
        const hexItems = gsap.utils.toArray('.hexagon-item') as HTMLElement[]
        hexItems.forEach((item, index) => {
          const hex = hexagons[index]
          if (!hex) return
          tl.to(
            item,
            {
              x: hex.randomX,
              y: hex.randomY,
              rotation: hex.randomRot,
              scale: hex.randomScale,
              opacity: 0,
              duration: 3.5,
              ease: 'power1.inOut',
            },
            0,
          )
        })

        // 2. Bring Title forward and fade it in
        tl.to(
          titleRef.current,
          {
            opacity: 1,
            scale: 1.1,
            letterSpacing: '0.14em',
            duration: 2.0,
            ease: 'power1.inOut',
          },
          0.5,
        )

        // 3. Stagger-in the clothing products into view
        cardsRef.current.forEach((card, index) => {
          if (!card) return
          const pos = styles[index]
          if (!pos) return

          tl.to(
            card,
            {
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotation: 0,
              ease: 'power2.out',
              duration: 3.5,
            },
            1.5,
          )
        })

        // 4. Hold frame for display
        tl.to({}, { duration: 2.0 })

        // 5. Fade out title and cards at the end
        tl.to(
          titleRef.current,
          {
            opacity: 0,
            scale: 0.8,
            y: -60,
            filter: 'blur(8px)',
            duration: 1.2,
            ease: 'power2.inOut',
          },
          '>-0.2',
        )

        tl.to(
          cardsRef.current,
          {
            opacity: 0,
            scale: 0.9,
            y: 50,
            duration: 1.2,
            ease: 'power2.inOut',
          },
          '<',
        )
      },
    )

    return () => mm.revert()
  }, [outfits, isMobile])

  if (isMobile) {
    return (
      <div className="w-full bg-[#D9A322] text-zinc-950 flex flex-col items-center justify-center overflow-hidden relative min-h-[85vh]">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes breathe-hex {
            0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.97); }
            50% { opacity: 1.0; transform: translate(-50%, -50%) scale(1.03); }
          }
          .animate-breathe {
            animation: breathe-hex var(--breathe-duration, 8s) ease-in-out infinite;
            animation-delay: var(--breathe-delay, 0s);
          }
        `,
          }}
        />
        {/* Animated Honeycomb grid background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
          {hexagons.map((hex, index) => (
            <div
              key={hex.id}
              className="absolute animate-breathe"
              style={
                {
                  left: `calc(50% + ${hex.x}px)`,
                  top: `calc(50% + ${hex.y}px)`,
                  transform: 'translate(-50%, -50%)',
                  '--breathe-delay': `${(index % 7) * -1.3}s`,
                  '--breathe-duration': `${7 + (index % 5) * 1.5}s`,
                } as React.CSSProperties
              }
            >
              <svg
                viewBox="0 0 100 86.6"
                className="w-[100px] h-[87px] text-white/10 fill-current stroke-white/25 stroke-[1px]"
              >
                <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" />
              </svg>
            </div>
          ))}
        </div>

        {/* Buttons Centered */}
        <div className="flex flex-col gap-6 items-center justify-center z-10 w-full px-6 py-12">
          {/* Explore Store button */}
          <a
            href="/shop"
            className="group relative p-[1px] transition-transform duration-300 hover:scale-105 active:scale-[0.98]"
            style={{
              clipPath:
                'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
            }}
          >
            {/* Border layer */}
            <div
              className="absolute inset-0 bg-zinc-900/10 group-hover:bg-zinc-900/25 group-active:bg-zinc-900/30 transition-colors duration-300"
              style={{
                clipPath:
                  'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
              }}
            />
            {/* Content layer */}
            <div
              className="relative px-8 py-3 bg-white group-hover:bg-neutral-50 group-active:bg-neutral-100 text-zinc-900 transition-colors duration-300 flex items-center justify-center w-[240px] h-12"
              style={{
                clipPath:
                  'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
              }}
            >
              <span className="relative z-10 flex overflow-hidden h-[1.2em] leading-[1.2em] uppercase tracking-[0.1em] font-medium">
                {'Explore Store'.split('').map((char, index) => (
                  <span
                    key={index}
                    className="flex flex-col transition-transform duration-500 ease-out group-hover:-translate-y-1/2 group-active:-translate-y-1/2"
                    style={{ transitionDelay: `${index * 25}ms`, height: '2.4em' }}
                  >
                    <span className="h-[1.2em] flex items-center justify-center">
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                    <span
                      className="h-[1.2em] flex items-center justify-center text-zinc-950 font-bold"
                      aria-hidden="true"
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          </a>

          {/* All Collections button */}
          <a
            href="/collections"
            className="group relative p-[1px] transition-transform duration-300 hover:scale-105 active:scale-[0.98]"
            style={{
              clipPath:
                'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
            }}
          >
            {/* Border layer */}
            <div
              className="absolute inset-0 bg-zinc-900/10 group-hover:bg-zinc-900/25 group-active:bg-zinc-900/30 transition-colors duration-300"
              style={{
                clipPath:
                  'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
              }}
            />
            {/* Content layer */}
            <div
              className="relative px-8 py-3 bg-white group-hover:bg-neutral-50 group-active:bg-neutral-100 text-zinc-900 transition-colors duration-300 flex items-center justify-center w-[240px] h-12"
              style={{
                clipPath:
                  'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
              }}
            >
              <span className="relative z-10 flex overflow-hidden h-[1.2em] leading-[1.2em] uppercase tracking-[0.1em] font-medium">
                {'All Collections'.split('').map((char, index) => (
                  <span
                    key={index}
                    className="flex flex-col transition-transform duration-500 ease-out group-hover:-translate-y-1/2 group-active:-translate-y-1/2"
                    style={{ transitionDelay: `${index * 25}ms`, height: '2.4em' }}
                  >
                    <span className="h-[1.2em] flex items-center justify-center">
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                    <span
                      className="h-[1.2em] flex items-center justify-center text-zinc-950 font-bold"
                      aria-hidden="true"
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-[250vh] w-full bg-transparent">
      {/* Sticky viewport container */}
      <div
        ref={stickyRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#D9A322] text-zinc-950"
      >
        {/* Soft dark center overlay to add slight depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] rounded-full bg-black/5 blur-[100px] pointer-events-none" />

        {/* Honeycomb grid layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
          {hexagons.map((hex) => (
            <div
              key={hex.id}
              className="absolute hexagon-item"
              style={{
                left: `calc(50% + ${hex.x}px)`,
                top: `calc(50% + ${hex.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg
                viewBox="0 0 100 86.6"
                className="w-[100px] h-[87px] text-white/10 fill-current stroke-white/25 stroke-[1px]"
              >
                <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" />
              </svg>
            </div>
          ))}
        </div>

        {/* Scroll Indicator (Vertically & Horizontally Centered) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            ref={scrollIndicatorRef}
            className="transition-opacity gap-5 duration-300 flex justify-center items-center flex-col pointer-events-auto"
          >
            <div className="flex gap-4 justify-center items-center uppercase tracking-[0.25em] text-[10px] sm:text-xs font-mono font-semibold">
              <a
                href="/shop"
                className="group relative p-[1px] transition-transform duration-300 hover:scale-105 active:scale-[0.98]"
                style={{
                  clipPath:
                    'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
                }}
              >
                {/* Border layer */}
                <div
                  className="absolute inset-0 bg-zinc-900/10 group-hover:bg-zinc-900/25 group-active:bg-zinc-900/30 transition-colors duration-300"
                  style={{
                    clipPath:
                      'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
                  }}
                />
                {/* Content layer */}
                <div
                  className="relative px-8 py-3 bg-white group-hover:bg-neutral-50 group-active:bg-neutral-100 text-zinc-900 transition-colors duration-300 flex items-center justify-center min-w-[160px] h-11"
                  style={{
                    clipPath:
                      'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
                  }}
                >
                  <span className="relative z-10 flex overflow-hidden h-[1.2em] leading-[1.2em]">
                    {'Explore Store'.split('').map((char, index) => (
                      <span
                        key={index}
                        className="flex flex-col transition-transform duration-500 ease-out group-hover:-translate-y-1/2 group-active:-translate-y-1/2"
                        style={{ transitionDelay: `${index * 25}ms`, height: '2.4em' }}
                      >
                        <span className="h-[1.2em] flex items-center justify-center">
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                        <span
                          className="h-[1.2em] flex items-center justify-center text-zinc-950 font-bold"
                          aria-hidden="true"
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              </a>
              <a
                href="/collections"
                className="group relative p-[1px] transition-transform duration-300 hover:scale-105 active:scale-[0.98]"
                style={{
                  clipPath:
                    'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
                }}
              >
                {/* Border layer */}
                <div
                  className="absolute inset-0 bg-zinc-900/10 group-hover:bg-zinc-900/25 group-active:bg-zinc-900/30 transition-colors duration-300"
                  style={{
                    clipPath:
                      'polygon(15px 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0% 50%)',
                  }}
                />
                {/* Content layer */}
                <div
                  className="relative px-8 py-3 bg-white group-hover:bg-neutral-50 group-active:bg-neutral-100 text-zinc-900 transition-colors duration-300 flex items-center justify-center min-w-[160px] h-11"
                  style={{
                    clipPath:
                      'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
                  }}
                >
                  <span className="relative z-10 flex overflow-hidden h-[1.2em] leading-[1.2em]">
                    {'All Collections'.split('').map((char, index) => (
                      <span
                        key={index}
                        className="flex flex-col transition-transform duration-500 ease-out group-hover:-translate-y-1/2 group-active:-translate-y-1/2"
                        style={{ transitionDelay: `${index * 25}ms`, height: '2.4em' }}
                      >
                        <span className="h-[1.2em] flex items-center justify-center">
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                        <span
                          className="h-[1.2em] flex items-center justify-center text-zinc-950 font-bold"
                          aria-hidden="true"
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              </a>
            </div>
            <span className="text-xl uppercase tracking-[0.3em] text-white font-mono text-center pl-[0.3em]">
              Scroll Down
            </span>
          </div>
        </div>

        {/* Central Title */}
        <div className="text-center z-10 pointer-events-none select-none">
          <p
            ref={titleRef}
            className="text-6xl font-bold text-white tracking-tightest uppercase font-sans drop-shadow-[0_2px_15px_rgba(0,0,0,0.15)]"
          >
            honeylooms
          </p>
        </div>

        {/* Staggered Outfits grid */}
        {outfits.map((product, index) => {
          const gallery = product.gallery
          const images =
            gallery?.filter(
              (
                item,
              ): item is NonNullable<NonNullable<Product['gallery']>[number]> & {
                image: Exclude<NonNullable<Product['gallery']>[number]['image'], string | number>
              } =>
                Boolean(
                  item?.image &&
                  typeof item.image === 'object' &&
                  'url' in item.image &&
                  item.image.url,
                ),
            ) ?? []
          const primaryImage = images[0]?.image

          return (
            <Link
              key={`${product.id}-${index}`}
              href={`/products/${product.slug}`}
              ref={(el) => {
                cardsRef.current[index] = el
              }}
              className={`absolute aspect-[2/3] w-[min(16vw,22vh)] xl:w-[min(13vw,20vh)] overflow-hidden bg-neutral-900 border border-white/5 rounded-md shadow-2xl transition-transform duration-300 hover:scale-[1.03] group z-20 pointer-events-auto card-item
                ${index === 1 || index === 4 ? 'hidden xl:block' : ''}
              `}
            >
              {/* Image with zoom effect on hover */}
              {primaryImage ? (
                <div className="relative w-full h-full">
                  <Media
                    fill
                    className="absolute inset-0 w-full h-full"
                    imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    resource={primaryImage}
                    size="(max-width: 768px) 30vw, 15vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-85" />

                  {/* Product Details (Title & Price) overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col gap-0.5 z-10">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-300 font-mono truncate">
                      {product.title}
                    </span>
                    {typeof product.priceInUSD === 'number' && (
                      <Price
                        amount={product.priceInUSD}
                        className="text-[10px] font-semibold text-white font-mono"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600 bg-zinc-900">
                  No Outfit Image
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
