'use client'

import React, { useEffect } from 'react'
import type { Product } from '@/payload-types'

type Props = {
  product: Product
}

export function RecentlyViewedTracker({ product }: Props) {
  useEffect(() => {
    if (!product || !product.id) return

    try {
      const storageKey = 'honeylooms_recently_viewed_ids'
      const rawData = localStorage.getItem(storageKey)
      let list: (string | number)[] = []

      if (rawData) {
        list = JSON.parse(rawData)
        if (!Array.isArray(list)) list = []
      }

      // Filter out current product if already in list to avoid duplicates
      list = list.filter((id) => id !== product.id)

      // Add to front of list
      list.unshift(product.id)

      // Keep only the last 6 viewed items
      list = list.slice(0, 6)

      localStorage.setItem(storageKey, JSON.stringify(list))
    } catch (e) {
      console.error('Failed to update recently viewed items:', e)
    }
  }, [product?.id])

  return null
}
