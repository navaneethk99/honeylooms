'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useEffect, useRef, useState } from 'react'

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

function BannerImage({
  banner,
  isFirst,
  blurred = false,
}: {
  banner: Banner
  isFirst: boolean
  blurred?: boolean
}) {
  return (
    <picture className="block size-full">
      <source media="(max-width: 767px)" srcSet={banner.mobileSrc} />
      <img
        alt={blurred ? '' : banner.alt}
        className={`block size-full ${
          blurred
            ? 'scale-110 object-cover blur-lg'
            : 'object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)]'
        }`}
        decoding="async"
        fetchPriority={isFirst ? 'high' : 'auto'}
        loading={isFirst ? 'eager' : 'lazy'}
        src={banner.desktopSrc}
      />
    </picture>
  )
}

export function HomepageBannerMedia({ banners }: Props) {
  const bannerRef = useRef<HTMLDivElement>(null)
  const [carouselRef, carouselApi] = useEmblaCarousel({
    loop: true,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const activeDelay = banners[activeIndex]?.rotationDelay ?? 5

  useEffect(() => {
    const section = bannerRef.current?.closest('section')
    const header = document.querySelector('.site-header')
    if (!section || !header) return

    const updateHeight = () => {
      const headerHeight = section.getBoundingClientRect().top + window.scrollY
      section.style.setProperty('--homepage-header-height', `${headerHeight}px`)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)
    // The promo bar sits immediately before the navbar when enabled.
    if (header.previousElementSibling) observer.observe(header.previousElementSibling)

    return () => {
      observer.disconnect()
      section.style.removeProperty('--homepage-header-height')
    }
  }, [])

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => setActiveIndex(carouselApi.selectedScrollSnap())
    carouselApi.on('select', onSelect)
    carouselApi.on('reInit', onSelect)

    return () => {
      carouselApi.off('select', onSelect)
      carouselApi.off('reInit', onSelect)
    }
  }, [carouselApi])

  useEffect(() => {
    if (
      !carouselApi ||
      isPaused ||
      banners.length <= 1 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      carouselApi.scrollNext()
    }, activeDelay * 1000)

    return () => window.clearTimeout(timer)
  }, [activeDelay, activeIndex, banners.length, carouselApi, isPaused])

  if (banners.length === 0) return null

  return (
    <div
      aria-label="Homepage banners"
      aria-roledescription="carousel"
      className="absolute inset-0 overflow-hidden bg-[#24231f]"
      ref={bannerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {banners.map((banner, index) => (
          <div
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
            key={banner.id}
          >
            <BannerImage banner={banner} blurred isFirst={index === 0} />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/15" />
      </div>

      <div className="relative h-full overflow-hidden" ref={carouselRef}>
        <div className="flex h-full touch-pan-y">
          {banners.map((banner, index) => (
            <div
              aria-hidden={index !== activeIndex}
              aria-label={`${index + 1} of ${banners.length}`}
              aria-roledescription="slide"
              className="h-full min-w-0 shrink-0 basis-full px-5 pb-36 pt-10 md:px-16 md:pb-24"
              key={banner.id}
              role="group"
            >
              <BannerImage banner={banner} isFirst={index === 0} />
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 ? (
        <div className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-2.5 py-2 backdrop-blur-sm">
          {banners.map((banner, index) => (
            <button
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                index === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              key={banner.id}
              onClick={() => carouselApi?.scrollTo(index)}
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
