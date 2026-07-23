'use client'

import { Button } from '@/components/ui/button'
import type { Cart, Product, Variant } from '@/payload-types'
import { useAuth } from '@/providers/Auth'

import { useCart, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const waitFor = async (condition: () => boolean, timeout = 2000): Promise<boolean> => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    if (condition()) return true
    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  return condition()
}

const getItemQuantity = (
  cart: Cart | null | undefined,
  productID: Product['id'],
  variantID?: Variant['id'],
): number => {
  return (
    cart?.items
      ?.filter((item) => {
        const itemProductID = typeof item.product === 'object' ? item.product?.id : item.product
        const itemVariantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined

        return itemProductID === productID && itemVariantID === variantID
      })
      .reduce((quantity, item) => quantity + (item.quantity || 0), 0) || 0
  )
}

type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const { user } = useAuth()
  const { clearSession, onLogin } = useEcommerce()
  const searchParams = useSearchParams()
  const [isAdding, setIsAdding] = useState(false)
  const addItemRef = useRef(addItem)
  const cartRef = useRef<Cart | null | undefined>(cart)
  const onLoginRef = useRef(onLogin)

  addItemRef.current = addItem
  cartRef.current = cart
  onLoginRef.current = onLogin

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
    async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      const item = {
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      }
      const initialQuantity = getItemQuantity(cartRef.current, item.product, item.variant)

      setIsAdding(true)

      try {
        await addItemRef.current(item)

        const firstAttemptSucceeded = await waitFor(
          () => getItemQuantity(cartRef.current, item.product, item.variant) > initialQuantity,
        )

        if (!firstAttemptSucceeded) {
          const staleAddItem = addItemRef.current
          clearSession()

          const sessionWasCleared = await waitFor(() => addItemRef.current !== staleAddItem)
          if (!sessionWasCleared) {
            throw new Error('The cart session could not be reset.')
          }

          if (user) {
            const preLoginAddItem = addItemRef.current
            await onLoginRef.current()
            await waitFor(() => addItemRef.current !== preLoginAddItem)
          }

          const retryBaseline = getItemQuantity(cartRef.current, item.product, item.variant)
          await addItemRef.current(item)

          const retrySucceeded = await waitFor(
            () => getItemQuantity(cartRef.current, item.product, item.variant) > retryBaseline,
          )

          if (!retrySucceeded) {
            throw new Error('The cart did not update after retrying.')
          }
        }

        toast.success('Item added to cart.')
      } catch {
        toast.error('Unable to add this item to your cart. Please try again.')
      } finally {
        setIsAdding(false)
      }
    },
    [clearSession, product.id, selectedVariant?.id, user],
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
        disabled || isLoading || isAdding
          ? 'bg-neutral-100 border-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-900 dark:border-neutral-900 dark:text-neutral-700'
          : 'bg-neutral-950 border-neutral-950 text-neutral-50 hover:bg-neutral-900 dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer',
      )}
      disabled={disabled || isLoading || isAdding}
      onClick={addToCart}
      type="submit"
    >
      {isLoading || isAdding
        ? 'Adding...'
        : isOutOfStock
          ? 'Out of Stock'
          : product.enableVariants && !selectedVariant
            ? 'Select size'
            : 'Add to bag'}
    </button>
  )
}
