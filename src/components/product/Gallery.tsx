'use client'

import type { Media as MediaType, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import clsx from 'clsx'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }
  }, [api])

  useEffect(() => {
    const values = Array.from(searchParams.values())

    if (values && api) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        let variantID: DefaultDocumentIDType

        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption

        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [searchParams, api, gallery])

  return (
    <div>
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-neutral-50 dark:bg-neutral-900 mb-4">
        <Media
          resource={gallery[current].image}
          fill
          className="absolute inset-0"
          imgClassName="w-full h-full object-cover rounded-none"
        />
      </div>

      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent className="-ml-2">
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null

            return (
              <CarouselItem
                className="basis-1/5 pl-2 cursor-pointer"
                key={`${item.image.id}-${i}`}
                onClick={() => setCurrent(i)}
              >
                <div
                  className={clsx(
                    'relative aspect-[2/3] w-full overflow-hidden border transition-all duration-200',
                    i === current
                      ? 'border-neutral-950 dark:border-neutral-50'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600',
                  )}
                >
                  <Media
                    fill
                    className="absolute inset-0"
                    imgClassName="w-full h-full object-cover rounded-none"
                    resource={item.image}
                  />
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
