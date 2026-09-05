'use client'

import { useEffect, useState } from 'react'

type Props = {
  banners: Array<{
    alt: string
    desktopSrc: string
    id: string
    mobileSrc: string
    rotationDelay: number
  }>
}

type Banner = Props['banners'][number]

function BannerSlide({
  banner,
  isActive,
  isFirst,
}: {
  banner: Banner
  isActive: boolean
  isFirst: boolean
}) {
  return (
    <div
      aria-hidden={!isActive}
      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <picture className="block size-full">
        <source media="(max-width: 767px)" srcSet={banner.mobileSrc} />
        <img
          alt={banner.alt}
          className="home-hero-media block size-full object-cover"
          decoding="async"
          fetchPriority={isFirst ? 'high' : 'auto'}
          loading={isFirst ? 'eager' : 'lazy'}
          src={banner.desktopSrc}
        />
      </picture>
    </div>
  )
}

export function HomepageBannerMedia({ banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeDelay = banners[activeIndex]?.rotationDelay ?? 5

  useEffect(() => {
    if (banners.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % banners.length)
    }, activeDelay * 1000)

    return () => window.clearTimeout(timer)
  }, [activeDelay, activeIndex, banners.length])

  if (banners.length === 0) return null

  return (
    <div aria-label="Homepage banners" aria-roledescription="carousel" className="absolute inset-0">
      {banners.map((banner, index) => (
        <BannerSlide
          banner={banner}
          isActive={index === activeIndex}
          isFirst={index === 0}
          key={banner.id}
        />
      ))}

      {banners.length > 1 ? (
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-2.5 py-2 backdrop-blur-sm md:top-6">
          {banners.map((banner, index) => (
            <button
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                index === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              key={banner.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function HomepageFallbackBanner() {
  return (
    <picture className="absolute inset-0 block">
      <source media="(max-width: 767px)" srcSet="/homepage-banner-fallback-mobile.svg" />
      <img
        alt=""
        aria-hidden="true"
        className="home-hero-media size-full object-contain"
        fetchPriority="high"
        src="/homepage-banner-fallback.svg"
      />
    </picture>
  )
}
