'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/utilities/cn'

type InstagramReelsProps = {
  urls: string[]
}

const getInstagramEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url.trim())
    const isInstagramHost =
      parsedUrl.hostname === 'instagram.com' || parsedUrl.hostname.endsWith('.instagram.com')

    if (!isInstagramHost) {
      return null
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean)
    const contentTypeIndex = segments.findIndex((segment) => segment === 'reel')
    const contentType = segments[contentTypeIndex]
    const shortcode = segments[contentTypeIndex + 1]

    if (!contentType || !shortcode) {
      return null
    }

    return `https://www.instagram.com/${contentType}/${shortcode}/embed`
  } catch {
    return null
  }
}

const CarouselPreviousMobile = () => {
  const { scrollPrev } = useCarousel()
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center text-neutral-500 hover:text-neutral-800 active:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100 dark:active:text-neutral-50 transition-colors"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        scrollPrev()
      }}
      aria-label="Previous Instagram reel"
    >
      <ChevronLeft className="h-7 w-7" />
    </button>
  )
}

const CarouselNextMobile = () => {
  const { scrollNext } = useCarousel()
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center text-neutral-500 hover:text-neutral-800 active:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100 dark:active:text-neutral-50 transition-colors"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        scrollNext()
      }}
      aria-label="Next Instagram reel"
    >
      <ChevronRight className="h-7 w-7" />
    </button>
  )
}

const CAROUSEL_OPTIONS = { loop: true }

export const InstagramReels = ({ urls }: InstagramReelsProps) => {
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => {
      setActiveIndex(carouselApi.selectedScrollSnap())
    }
    carouselApi.on('select', onSelect)
    onSelect()
    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi])

  const reels = urls
    .map((url) => ({
      embedUrl: getInstagramEmbedUrl(url),
      url,
    }))
    .filter((reel): reel is { embedUrl: string; url: string } => Boolean(reel.embedUrl))
    .slice(0, 4)

  if (reels.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4 py-16 md:py-15">
      <div className="mb-10 flex flex-col justify-between border-b border-neutral-100 pb-5 dark:border-neutral-900 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-3xl font-semibold uppercase tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            From Our Instagram
          </h2>
        </div>
        <a
          href="https://www.instagram.com/thehoneylooms/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 font-mono text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 md:mt-0"
        >
          Follow @thehoneylooms &rarr;
        </a>
      </div>

      <div className="px-0 md:px-12">
        <Carousel className="w-full" opts={CAROUSEL_OPTIONS} setApi={setCarouselApi}>
          <div className="relative">
            {/* Mobile arrow keys positioned on the sides */}
            <div className="absolute inset-y-0 left-2 z-30 flex items-center md:hidden">
              <CarouselPreviousMobile />
            </div>
            <div className="absolute inset-y-0 right-2 z-30 flex items-center md:hidden">
              <CarouselNextMobile />
            </div>

            <CarouselContent className="-ml-4 md:-ml-6">
              {reels.map((reel, index) => {
                const isActive = index === activeIndex
                return (
                  <CarouselItem
                    key={`${reel.embedUrl}-${index}`}
                    className="basis-[76%] pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/4"
                  >
                    <div
                      className={cn(
                        "w-full transition-all duration-300 ease-in-out",
                        isActive
                          ? "opacity-100 scale-100 blur-none"
                          : "opacity-40 scale-95 blur-[2px] pointer-events-none md:opacity-100 md:scale-100 md:blur-none md:pointer-events-auto"
                      )}
                    >
                      <div className="flex justify-center bg-background">
                        <div className="relative w-full max-w-[360px] h-[580px]">
                          <iframe
                            src={reel.embedUrl}
                            title={`Honeylooms Instagram reel ${index + 1}`}
                            className="h-full w-full"
                            loading="lazy"
                            scrolling="no"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                          />
                          <a
                            href={reel.url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 z-10 block cursor-pointer"
                            aria-label={`Open Instagram reel ${index + 1} on Instagram`}
                          />
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </div>
        </Carousel>
      </div>
    </section>
  )
}
