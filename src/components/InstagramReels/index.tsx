'use client'

import Image from 'next/image'
import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'

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

const CAROUSEL_OPTIONS = { align: 'center' as const, loop: true }

export const InstagramReels = ({ urls }: InstagramReelsProps) => {
  const reels = urls.slice(0, 4)

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
                    key={`${reel}-${index}`}
                    className="basis-[88%] pl-0 md:basis-1/2 md:pl-2 xl:basis-1/3 2xl:basis-1/4"
                  >
                    <CarouselSlideMotion index={index}>
                      <div className="flex justify-center">
                        <div className="relative w-full max-w-[400px] overflow-hidden bg-background shadow-[0_0_10px_rgba(0,0,0,0.1)]">
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
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-semibold">thehoneylooms</span>
                              <span className="block truncate text-xs text-neutral-500">Watch this reel on Instagram &rarr;</span>
                            </div>
                          </div>

                          <div className="relative aspect-[9/16] bg-black">
                            <img
                              src={`/api/instagram/reel-preview?url=${encodeURIComponent(reel)}`}
                              alt={`Preview of Honeylooms Instagram reel ${index + 1}`}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-3 py-3 text-neutral-950">
                            <div className="flex items-center gap-4">
                              <Heart aria-hidden="true" className="size-6 stroke-[1.75]" />
                              <MessageCircle aria-hidden="true" className="size-6 stroke-[1.75]" />
                              <Send aria-hidden="true" className="size-6 stroke-[1.75]" />
                            </div>
                            <Bookmark aria-hidden="true" className="size-6 stroke-[1.75]" />
                          </div>
                          <a
                            href={reel}
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
