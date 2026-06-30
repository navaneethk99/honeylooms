'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const searchParams = useSearchParams()

  const variants = product.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')

      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      }).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, selectedVariant],
  )

  const disabled = useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === selectedVariant?.id
        }
        return true
      }
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity

      if (product.enableVariants) {
        return existingQuantity >= (selectedVariant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!selectedVariant) {
        return true
      }

      if (selectedVariant.inventory === 0) {
        return true
      }
    } else {
      if (product.inventory === 0) {
        return true
      }
    }

    return false
  }, [selectedVariant, cart?.items, product])

  const isOutOfStock = useMemo<boolean>(() => {
    if (product.enableVariants) {
      if (selectedVariant) {
        const existingItem = cart?.items?.find((item) => {
          const productID = typeof item.product === 'object' ? item.product?.id : item.product
          const variantID = item.variant
            ? typeof item.variant === 'object'
              ? item.variant?.id
              : item.variant
            : undefined

          return productID === product.id && variantID === selectedVariant.id
        })

        if (existingItem && existingItem.quantity >= (selectedVariant.inventory || 0)) {
          return true
        }

        return selectedVariant.inventory === 0 || !selectedVariant.inventory
      }

      const allVariants = product.variants?.docs || []
      if (allVariants.length > 0) {
        return allVariants.every((variant) => {
          if (typeof variant === 'object' && variant !== null) {
            return variant.inventory === 0 || !variant.inventory
          }
          return true
        })
      }
      return true
    }

    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      return productID === product.id
    })

    if (existingItem && existingItem.quantity >= (product.inventory || 0)) {
      return true
    }

    return product.inventory === 0 || !product.inventory
  }, [selectedVariant, cart?.items, product])

  return (
    <button
      aria-label="Add to cart"
      className={clsx(
        'w-full max-w-[320px] mx-auto py-4 text-xs font-semibold uppercase tracking-widest transition-all duration-300 rounded-none flex items-center justify-center border h-12',
        disabled || isLoading
          ? 'bg-neutral-100 border-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-900 dark:border-neutral-900 dark:text-neutral-700'
          : 'bg-neutral-950 border-neutral-950 text-neutral-50 hover:bg-neutral-900 dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer',
      )}
      disabled={disabled || isLoading}
      onClick={addToCart}
      type="submit"
    >
      {isLoading
        ? 'Adding...'
        : isOutOfStock
        ? 'Out of Stock'
        : product.enableVariants && !selectedVariant
        ? 'Select size'
        : 'Add to bag'}
    </button>
  )
}
