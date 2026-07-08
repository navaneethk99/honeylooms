'use client'

import React, { useEffect, useState } from 'react'
import { ProductGridItem } from '@/components/ProductGridItem'
import type { Product } from '@/payload-types'
import { fetchProductsByIds } from './actions'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

export function RecentlyViewedList() {
  const [items, setItems] = useState<Product[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    async function loadItems() {
      try {
        const rawData = localStorage.getItem('honeylooms_recently_viewed_ids')
        if (rawData) {
          const ids = JSON.parse(rawData)
          if (Array.isArray(ids) && ids.length > 0) {
            const slicedIds = ids.slice(0, 4)
            const products = await fetchProductsByIds(slicedIds)
            setItems(products.slice(0, 4))
          }
        }
      } catch (e) {
        console.error('Failed to load recently viewed items:', e)
      }
    }

    loadItems()
  }, [])

  // Avoid hydration mismatches (server-vs-client differences) by rendering nothing on server
  if (!mounted || items.length === 0) return null

  return (
    <section className="container mx-auto px-4 pt-16 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-neutral-100 dark:border-neutral-900 pb-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-4xl font-semibold font-sans tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
            Recently Viewed
          </h2>
        </div>
      </div>

      {/* Carousel wrapper with desktop padding for navigation buttons */}
      <div className="px-0 md:px-12">
        <Carousel className="w-full" opts={{ loop: false, align: 'start' }}>
          <CarouselContent className="-ml-4 md:-ml-6">
            {items.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-4 md:pl-6 basis-1/2 sm:basis-1/3 md:basis-1/4"
              >
                <div className="h-full w-full">
                  <ProductGridItem product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {items.length > 4 && (
            <>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  )
}
