'use client'

import { Price } from '@/components/Price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { CartBagModel, OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'
import { Product, Variant } from '@/payload-types'
import {
  getEffectiveProductPrice,
  getOriginalProductPrice,
  isProductOnSale,
} from '@/utilities/pricing'

export function CartModal() {
  const pathname = usePathname()
  // A route change starts with a closed drawer, without an extra effect render.
  return <CartModalContent key={pathname} />
}

function CartModalContent() {
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription>Review your styles and sizes before checkout.</SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-2">
            <CartBagModel className="pointer-events-none" height={112} width={96} />
            <p className="text-center text-2xl font-bold">Your cart is empty.</p>
            <p className="px-6 text-sm text-neutral-600">
              Find a style you love and make it yours.
            </p>
            <Button asChild className="mt-4 rounded-none">
              <Link href="/shop" onClick={() => setIsOpen(false)}>
                Explore the shop
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 grow px-4">
            <div className="flex min-h-0 w-full flex-col justify-between">
              <ul className="min-h-0 grow overflow-y-auto py-4">
                {cart?.items?.map((item, i) => {
                  const product = item.product as Product
                  const variant = item.variant as Variant

                  if (typeof product !== 'object' || !item || !product || !product.slug)
                    return <React.Fragment key={i} />

                  const metaImage =
                    product.meta?.image && typeof product.meta?.image === 'object'
                      ? product.meta.image
                      : undefined

                  const firstGalleryImage =
                    typeof product.gallery?.[0]?.image === 'object'
                      ? product.gallery?.[0]?.image
                      : undefined

                  let image = firstGalleryImage || metaImage
                  const productOnSale = isProductOnSale(product)
                  let price = getEffectiveProductPrice(product)
                  const originalPrice = getOriginalProductPrice(product, variant)

                  const isVariant = Boolean(variant) && typeof variant === 'object'

                  if (isVariant) {
                    if (!product.onSale && typeof variant?.priceInUSD === 'number') {
                      price = variant.priceInUSD
                    }

                    const imageVariant = product.gallery?.find((item) => {
                      if (!item.variantOption) return false
                      const variantOptionID =
                        typeof item.variantOption === 'object'
                          ? item.variantOption.id
                          : item.variantOption

                      const hasMatch = variant?.options?.some((option) => {
                        if (typeof option === 'object') return option.id === variantOptionID
                        else return option === variantOptionID
                      })

                      return hasMatch
                    })

                    if (imageVariant && typeof imageVariant.image === 'object') {
                      image = imageVariant.image
                    }
                  }

                  return (
                    <li className="flex w-full flex-col" key={i}>
                      <div className="relative flex w-full flex-row justify-between px-1 py-4">
                        <div className="absolute z-40 -mt-2 ml-[55px]">
                          <DeleteItemButton item={item} />
                        </div>
                        <Link
                          className="z-30 flex min-w-0 flex-1 flex-row gap-3 pr-3"
                          href={`/products/${(item.product as Product)?.slug}`}
                        >
                          <div className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                            {image?.url && (
                              <Image
                                alt={image?.alt || product?.title || ''}
                                className="h-full w-full object-cover"
                                height={94}
                                src={image.url}
                                width={94}
                              />
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col text-sm">
                            <span className="break-words leading-tight">{product?.title}</span>
                            {/*{productOnSale ? (
                              <span className="mt-1 inline-flex w-fit items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Sale
                              </span>
                            ) : null}*/}
                            {isVariant && variant ? (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                                {variant.options
                                  ?.map((option) => {
                                    if (typeof option === 'object') return option.label
                                    return null
                                  })
                                  .join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                        <div className="flex h-16 flex-col justify-between">
                          {typeof price === 'number' && (
                            <div className="flex flex-col items-end text-right">
                              <Price
                                amount={price}
                                className="text-sm font-semibold text-black dark:text-white"
                              />
                              {productOnSale ? (
                                <Price
                                  amount={originalPrice}
                                  className="text-xs text-neutral-400 line-through dark:text-neutral-500"
                                />
                              ) : null}
                            </div>
                          )}
                          <div className="ml-auto flex h-9 flex-row items-center rounded-lg border">
                            <EditItemQuantityButton item={item} type="minus" />
                            <p className="w-6 text-center">
                              <span className="w-full text-sm">{item.quantity}</span>
                            </p>
                            <EditItemQuantityButton item={item} type="plus" />
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="shrink-0 border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]">
                <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {typeof cart?.subtotal === 'number' && (
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Subtotal</p>
                      <Price
                        amount={cart?.subtotal}
                        className="text-right text-base text-black dark:text-white"
                      />
                    </div>
                  )}

                  <div className="mb-4 space-y-1 text-xs leading-relaxed">
                    <p>Free prepaid shipping across India.</p>

                    {/*<Link
                      className="inline-block underline text-center underline-offset-4"
                      href="/deliveries-and-returns"
                    >
                      Delivery &amp; returns policy
                    </Link>*/}
                  </div>
                  <Button asChild className="min-h-12 rounded-none">
                    <Link className="w-full" href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                  <p className="mt-2 text-center text-xs">New here? Guest checkout is available.</p>
                  <button
                    className="mt-3 min-h-11 w-full text-center text-sm underline underline-offset-4"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    Continue shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
