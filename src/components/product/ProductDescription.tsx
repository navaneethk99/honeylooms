'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import Image from 'next/image'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { StockIndicator } from '@/components/product/StockIndicator'
import { isProductOnSale } from '@/utilities/pricing'
import { Star } from 'lucide-react'

type Props = {
  averageRating?: number
  product: Product
  reviewCount: number
}

export function ProductDescription({ averageRating, product, reviewCount }: Props) {
  const { currency } = useCurrency()
  const productOnSale = isProductOnSale(product)
  const salePrice = productOnSale ? (product.salePrice ?? 0) : 0
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)
  const fullStars = averageRating === undefined ? 0 : Math.floor(averageRating)
  const hasPartialStar = averageRating !== undefined && averageRating > fullStars

  if (hasVariants) {
    const priceField = `priceIn${currency.code}` as keyof Variant
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          priceField in a &&
          priceField in b &&
          typeof a[priceField] === 'number' &&
          typeof b[priceField] === 'number'
        ) {
          return a[priceField] - b[priceField]
        }

        return 0
      }) as Variant[]

    const lowestVariant = variantsOrderedByPrice[0][priceField]
    const highestVariant = variantsOrderedByPrice[variantsOrderedByPrice.length - 1][priceField]
    if (
      variantsOrderedByPrice &&
      typeof lowestVariant === 'number' &&
      typeof highestVariant === 'number'
    ) {
      lowestAmount = lowestVariant
      highestAmount = highestVariant
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = product[priceField]
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title & Price stacked vertically */}
      <div className="flex flex-col gap-3">
        {productOnSale ? (
          <div className="flex items-center gap-2">
            {/*<span className="inline-flex w-fit items-center rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              On Sale
            </span>*/}
            {/*{product.discountPercentage ? (
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
                Save {product.discountPercentage}%
              </span>
            ) : null}*/}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {product.title}
        </h1>
        {averageRating !== undefined ? (
          <div
            className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300"
            aria-label={`${averageRating.toFixed(1)} out of 5 stars from ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`}
          >
            <span className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => {
                const starNumber = index + 1
                const fill =
                  starNumber <= fullStars
                    ? 100
                    : starNumber === fullStars + 1 && hasPartialStar
                      ? 50
                      : 0

                return (
                  <span key={starNumber} className="relative inline-flex size-4">
                    <Star className="size-4 text-[#b8b2a8]" />
                    {fill ? (
                      <span
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{ width: `${fill}%` }}
                      >
                        <Star className="size-4 shrink-0 fill-[#c79b46] text-[#c79b46]" />
                      </span>
                    ) : null}
                  </span>
                )
              })}
            </span>
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-neutral-500">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        ) : null}
        <div className="font-mono text-xl font-bold text-neutral-800 dark:text-neutral-200">
          {hasVariants ? (
            productOnSale ? (
              <div className="flex items-center gap-3">
                <Price amount={salePrice} className="text-black dark:text-red-400 font-bold" />
                {lowestAmount > 0 ? (
                  <Price
                    highestAmount={highestAmount}
                    lowestAmount={lowestAmount}
                    className="text-neutral-400 dark:text-neutral-500 line-through text-sm font-normal"
                  />
                ) : null}
                {product.discountPercentage ? (
                  <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">
                    -{product.discountPercentage}% OFF
                  </span>
                ) : null}
              </div>
            ) : (
              <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
            )
          ) : productOnSale ? (
            <div className="flex items-center gap-3">
              <Price amount={salePrice} className="text-blackk dark:text-red-400 font-bold" />
              <Price
                amount={amount}
                className="text-neutral-400 dark:text-neutral-500 line-through text-sm font-normal"
              />
              {/*{product.discountPercentage ? (
                <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">
                  -{product.discountPercentage}% OFF
                </span>
              ) : null}*/}
            </div>
          ) : (
            <Price amount={amount} />
          )}
        </div>
      </div>

      <div className="grid max-w-lg grid-cols-3 gap-2" aria-label="Honeylooms product qualities">
        <Image
          src="/cotton.webp"
          alt="Made with cotton"
          width={1628}
          height={662}
          sizes="300px"
          className="h-auto w-full"
        />
        <Image
          src="/handmade.webp"
          alt="Handmade"
          width={1641}
          height={662}
          sizes="300px"
          className="h-auto w-full"
        />
        <Image
          src="/india.webp"
          alt="Made in India"
          width={1641}
          height={662}
          sizes="300px"
          className="h-auto w-full"
        />
      </div>

      {/* Description block */}
      {product.description ? (
        <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
          <RichText data={product.description} enableGutter={false} />
        </div>
      ) : null}

      {/* Divider */}
      <div className="border-t border-neutral-100 dark:border-neutral-900" />

      {/* Variant Selector */}
      {hasVariants && (
        <div className="flex flex-col gap-6">
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>
          <div className="border-t border-neutral-100 dark:border-neutral-900" />
        </div>
      )}

      {/* Stock & Purchase section */}
      <div className="flex flex-col gap-6">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>

        <Suspense fallback={null}>
          <AddToCart product={product} />
        </Suspense>
      </div>
    </div>
  )
}
