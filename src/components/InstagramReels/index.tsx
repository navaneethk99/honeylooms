'use client'

import Image from 'next/image'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselMobileNext,
  CarouselMobilePrevious,
  CarouselSlideMotion,
} from '@/components/ui/carousel'

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

const CAROUSEL_OPTIONS = { align: 'center' as const, loop: true }

export const InstagramReels = ({ urls }: InstagramReelsProps) => {
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

      <div>
        <Carousel className="w-full" opts={CAROUSEL_OPTIONS}>
          <div className="relative">
            {/* Mobile arrow keys positioned on the sides */}
            <div className="absolute inset-y-0 left-2 z-30 flex items-center md:hidden">
              <CarouselMobilePrevious />
            </div>
            <div className="absolute inset-y-0 right-2 z-30 flex items-center md:hidden">
              <CarouselMobileNext />
            </div>

            <CarouselContent className="ml-0 p-1 md:-ml-2">
              {reels.map((reel, index) => {
                return (
                  <CarouselItem
                    key={`${reel.embedUrl}-${index}`}
                    className="basis-[88%] pl-0 md:basis-1/2 md:pl-2 xl:basis-1/3 2xl:basis-1/4"
                  >
                    <CarouselSlideMotion index={index}>
                      <div className="flex justify-center">
                        <div className="relative w-full max-w-[400px] overflow-hidden bg-background shadow-[0_0_10px_rgba(0,0,0,0.1)] [container-type:inline-size]">
                          <div className="flex h-15 items-center gap-3 border-b border-neutral-200 bg-white px-4 text-neutral-950">
                            <div className="size-10 shrink-0 overflow-hidden rounded-full">
                              <Image
                                src="/inverted_honeylooms.png"
                                alt="Honeylooms"
                                width={40}
                                height={40}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="truncate text-sm font-semibold">thehoneylooms</span>
                          </div>

                          <div className="relative h-[calc(clamp(580px,164.5cqw,658px)-84px)] overflow-hidden">
                            <iframe
                              src={reel.embedUrl}
                              title={`Honeylooms Instagram reel ${index + 1}`}
                              className="absolute -top-16 left-0 h-[clamp(580px,164.5cqw,658px)] w-full"
                              loading="lazy"
                              scrolling="no"
                              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            />
                          </div>
                          <a
                            href={reel.url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 z-10 block cursor-pointer"
                            aria-label={`Open Instagram reel ${index + 1} on Instagram`}
                          />
                        </div>
                      </div>
                    </CarouselSlideMotion>
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
