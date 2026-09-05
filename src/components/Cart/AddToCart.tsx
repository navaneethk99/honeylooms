'use client'

import { getPurchaseState } from '@/components/product/purchaseState'
import { trackStorefrontEvent } from '@/utilities/trackStorefrontEvent'
import type { Cart, Product, Variant } from '@/payload-types'
import { useAuth } from '@/providers/Auth'

import { useCart, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  useEffect(() => {
    addItemRef.current = addItem
    cartRef.current = cart
    onLoginRef.current = onLogin
  }, [addItem, cart, onLogin])

  const selectedVariant = useMemo<Variant | undefined>(() => {
    const variants = product.variants?.docs || []
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
  }, [product.enableVariants, product.variants?.docs, searchParams])

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

        trackStorefrontEvent('add_to_cart', {
          product_id: product.id,
          variant_id: selectedVariant?.id,
          quantity: 1,
        })
        toast.success('Item added to cart.')
      } catch {
        toast.error('Unable to add this item to your cart. Please try again.')
      } finally {
        setIsAdding(false)
      }
    },
    [clearSession, product.id, selectedVariant, user],
  )

  const {
    disabled,
    outOfStock: isOutOfStock,
    atCartLimit,
  } = getPurchaseState(product, selectedVariant, cart)

  return (
    <button
      aria-label={
        isOutOfStock
          ? 'Out of stock'
          : atCartLimit
            ? 'All available stock is in your bag'
            : product.enableVariants && !selectedVariant
              ? 'Select size'
              : 'Add to cart'
      }
      className={clsx(
        'w-full max-w-[320px] py-4 text-xs font-semibold uppercase tracking-widest transition-all duration-300 rounded-none flex items-center justify-center border h-12',
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
          : atCartLimit
            ? 'All available stock is in your bag'
            : product.enableVariants && !selectedVariant
              ? 'Select size'
              : 'Add to bag'}
    </button>
  )
}
