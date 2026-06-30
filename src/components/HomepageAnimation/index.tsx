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

  const desktopStyles = [
    { left: '6%', top: '8%', bottom: 'auto', right: 'auto' },
    { left: '26%', top: '38%', bottom: 'auto', right: 'auto' },
    { left: '6%', top: 'auto', right: 'auto', bottom: '8%' },
    { left: 'auto', top: '8%', right: '6%', bottom: 'auto' },
    { left: 'auto', top: '38%', right: '26%', bottom: 'auto' },
    { left: 'auto', top: 'auto', right: '6%', bottom: '8%' },
  ]

  useEffect(() => {
    if (!containerRef.current || !stickyRef.current || outfits.length === 0 || windowWidth === 0)
      return

    // Do not initialize ScrollTrigger / GSAP pinning on mobile (width < 768px)
    if (windowWidth < 768) return

    const ctx = gsap.context(() => {
      // Initialize card positions off-screen
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        const isLeft = index < 3
        const startX = isLeft ? -1200 : 1200
        const startY = isLeft ? (index % 3) * 150 - 150 : ((index - 3) % 3) * 150 - 150
        const pos = desktopStyles[index]
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
          letterSpacing: '0.18em',
          duration: 2.0,
          ease: 'power1.inOut',
        },
        0.5,
      )

      // 3. Stagger-in the clothing products into view
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        const pos = desktopStyles[index]
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
    }, containerRef)

    return () => ctx.revert()
  }, [outfits, windowWidth])

  const isMobile = windowWidth > 0 && windowWidth < 768

  if (isMobile) {
    return (
      <div className="w-full bg-[#D9A322] text-zinc-950 py-16 flex flex-col justify-between overflow-hidden relative min-h-[85vh]">
        {/* Static Honeycomb grid background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none flex items-center justify-center opacity-30">
          {hexagons.slice(0, 32).map((hex) => (
            <div
              key={hex.id}
              className="absolute"
              style={{
                left: `calc(50% + ${hex.x * 0.75}px)`,
                top: `calc(50% + ${hex.y * 0.75}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg
                viewBox="0 0 100 86.6"
                className="w-[80px] h-[70px] text-white/10 fill-current stroke-white/20 stroke-[1px]"
              >
                <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" />
              </svg>
            </div>
          ))}
        </div>

        {/* Brand Header */}
        <div className="text-center z-10 pointer-events-none select-none mb-10">
          <h1 className="text-5xl font-bold text-white tracking-widest uppercase font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
            honeylooms
          </h1>
        </div>

        {/* Horizontal scroll list of the 6 outfits */}
        <div className="w-full overflow-x-auto scrollbar-none snap-x snap-mandatory flex gap-5 px-6 pb-8 z-10">
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
                key={`mobile-${product.id}-${index}`}
                href={`/products/${product.slug}`}
                className="snap-center shrink-0 w-[65vw] sm:w-[45vw] aspect-[2/3] overflow-hidden bg-neutral-900 border border-white/5 rounded-lg shadow-xl relative block group"
              >
                {primaryImage ? (
                  <div className="relative w-full h-full">
                    <Media
                      fill
                      className="absolute inset-0 w-full h-full"
                      imgClassName="object-cover"
                      resource={primaryImage}
                      size="65vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80" />

                    <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col gap-0.5 z-10">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-200 font-mono truncate">
                        {product.title}
                      </span>
                      {typeof product.priceInUSD === 'number' && (
                        <Price
                          amount={product.priceInUSD}
                          className="text-xs font-semibold text-white font-mono"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500 bg-neutral-900">
                    No Outfit Image
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Footer Swipe indicator */}
        <div className="text-center z-10 pointer-events-none select-none mt-4">
          <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-700 font-mono">
            Swipe to view &rarr;
          </span>
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
            <div className="flex gap-3 justify-center items-center uppercase tracking-[0.3em]">
              <a
                href="/shop"
                className="bg-white/40 rounded-full px-2 py-1 border-2 hover:bg-white/50 transition-all duration-300"
              >
                Explore Store
              </a>
              <a
                href="/collections"
                className="bg-white/40 rounded-full px-2 py-1 border-2 hover:bg-white/50 transition-all duration-300"
              >
                All Collections
              </a>
            </div>
            <span className="text-xl uppercase tracking-[0.3em] text-white font-mono text-center pl-[0.3em]">
              Scroll Down
            </span>
          </div>
        </div>

        {/* Central Title */}
        <div className="text-center z-10 pointer-events-none select-none">
          <h1
            ref={titleRef}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-widest uppercase font-sans drop-shadow-[0_2px_15px_rgba(0,0,0,0.15)]"
          >
            honeylooms
          </h1>
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
              className={`absolute aspect-[2/3] w-[28vw] md:w-[15vw] overflow-hidden bg-neutral-900 border border-white/5 rounded-md shadow-2xl transition-transform duration-300 hover:scale-[1.03] group z-20 pointer-events-auto card-item
                ${index >= 4 ? 'hidden md:block' : ''}
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
