'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { StockIndicator } from '@/components/product/StockIndicator'
import { isProductOnSale } from '@/utilities/pricing'

export function ProductDescription({ product }: { product: Product }) {
  const { currency } = useCurrency()
  const productOnSale = isProductOnSale(product)
  const salePrice = productOnSale ? (product.salePrice ?? 0) : 0
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

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
