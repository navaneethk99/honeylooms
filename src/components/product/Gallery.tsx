'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import Image from 'next/image'
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
  const [isZoomPreviewVisible, setIsZoomPreviewVisible] = React.useState(false)
  const [zoomOrigin, setZoomOrigin] = React.useState('50% 50%')
  const [zoomPreviewPosition, setZoomPreviewPosition] = React.useState({ left: 0, top: 0 })
  const activeImage = gallery[current]?.image
  const activeImageURL =
    activeImage && typeof activeImage === 'object' ? getMediaUrl(activeImage.url) : undefined

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
        const animationFrame = window.requestAnimationFrame(() => {
          setCurrent(index)
          api.scrollTo(index, true)
        })
        return () => window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [searchParams, api, gallery])

  const updateZoomOrigin = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setZoomOrigin(`${x}% ${y}%`)

    const previewSize = 384
    const offset = 20
    const left =
      event.clientX + offset + previewSize > window.innerWidth
        ? event.clientX - previewSize - offset
        : event.clientX + offset
    const top = Math.min(event.clientY + offset, window.innerHeight - previewSize - 16)
    setZoomPreviewPosition({ left: Math.max(16, left), top: Math.max(16, top) })
  }

  return (
    <div>
      <div className="relative mb-4">
        <div
          className="relative aspect-[2/3] w-full cursor-zoom-in overflow-hidden bg-neutral-50 dark:bg-neutral-900"
          onMouseEnter={(event) => {
            setIsZoomPreviewVisible(true)
            updateZoomOrigin(event)
          }}
          onMouseLeave={() => setIsZoomPreviewVisible(false)}
          onMouseMove={updateZoomOrigin}
        >
          <Media
            resource={gallery[current].image}
            fill
            className="absolute inset-0"
            imgClassName="h-full w-full rounded-none object-cover"
          />
        </div>
        {isZoomPreviewVisible && activeImageURL ? (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-50 hidden aspect-square w-96 rounded-full border border-neutral-200 bg-neutral-50 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 lg:block"
            style={{
              left: zoomPreviewPosition.left,
              top: zoomPreviewPosition.top,
            }}
          >
            <Image
              alt=""
              aria-hidden="true"
              className="object-cover"
              fill
              sizes="384px"
              src={activeImageURL}
              style={{
                transform: 'scale(4)',
                transformOrigin: zoomOrigin,
              }}
            />
          </div>
        ) : null}
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
