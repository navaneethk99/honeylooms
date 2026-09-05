'use client'

import type { Product } from '@/payload-types'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import {
  getEffectiveProductPrice,
  getOriginalProductPrice,
  isProductOnSale,
} from '@/utilities/pricing'
import { trackStorefrontEvent } from '@/utilities/trackStorefrontEvent'
import { CreditCard, Mail, Ruler, Star, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { StockIndicator } from './StockIndicator'
import { VariantSelector } from './VariantSelector'
import { getProductVariants, getSelectedVariant } from './purchaseState'

type Props = {
  averageRating?: number
  product: Product
  reviewCount: number
}

export function ProductDescription({ averageRating, product, reviewCount }: Props) {
  const searchParams = useSearchParams()
  const selectedVariant = getSelectedVariant(product, searchParams.get('variant'))
  const variants = getProductVariants(product)
  const hasVariants = Boolean(product.enableVariants && variants.length)
  const productOnSale = isProductOnSale(product)
  const amount = getEffectiveProductPrice(product, selectedVariant)
  const originalAmount = getOriginalProductPrice(product, selectedVariant)
  const variantPrices = variants.map((variant) => getEffectiveProductPrice(product, variant))
  const showRange = hasVariants && !selectedVariant && !productOnSale
  const supportURL = `mailto:contact@honeylooms.in?subject=${encodeURIComponent(`Help with ${product.title}`)}`

  useEffect(() => {
    trackStorefrontEvent('product_viewed', { product_id: product.id, product_slug: product.slug })
  }, [product.id, product.slug])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {product.title}
        </h1>
        {averageRating !== undefined ? (
          <div
            className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
            aria-label={`${averageRating.toFixed(1)} out of 5 stars from ${reviewCount} customer ${reviewCount === 1 ? 'rating' : 'ratings'}`}
          >
            <Star aria-hidden="true" className="size-4 fill-[#c79b46] text-[#c79b46]" />
            <span className="font-medium">{averageRating.toFixed(1)} / 5</span>
            <span className="text-neutral-500">
              ({reviewCount} customer {reviewCount === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        ) : null}

        <div
          className="flex flex-wrap items-center gap-3 font-mono text-xl font-bold text-neutral-800 dark:text-neutral-200"
          aria-live="polite"
          aria-atomic="true"
        >
          {showRange ? (
            <Price
              lowestAmount={Math.min(...variantPrices)}
              highestAmount={Math.max(...variantPrices)}
            />
          ) : (
            <Price amount={amount} />
          )}
          {productOnSale && originalAmount > amount ? (
            <>
              <Price
                amount={originalAmount}
                className="text-sm font-normal text-neutral-500 line-through"
              />
              <span className="bg-[#D9A322]/15 px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200">
                Save {Math.round(((originalAmount - amount) / originalAmount) * 100)}%
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 text-xs leading-relaxed text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
        <p className="flex items-start gap-2">
          <Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-medium text-neutral-900 dark:text-neutral-100">
              Free prepaid shipping
            </strong>
            <br />
            Across India
          </span>
        </p>
        <p className="flex items-start gap-2">
          <CreditCard aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-medium text-neutral-900 dark:text-neutral-100">
              UPI or cash on delivery
            </strong>
          </span>
        </p>
      </div>
      <div
        id="product-purchase"
        className="flex scroll-mt-28 flex-col gap-5 border-y border-neutral-200 py-5 dark:border-neutral-800"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Find your fit</p>
          <Link
            href="/sizing"
            className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"
          >
            <Ruler aria-hidden="true" className="size-4" />
            Size guide
          </Link>
        </div>
        {hasVariants ? <VariantSelector product={product} /> : null}
        <StockIndicator product={product} />
        <div className="flex min-w-full justify-center">
          <AddToCart product={product} />
        </div>

        <a
          href={supportURL}
          className="inline-flex min-h-11 items-center justify-center gap-2 text-sm underline underline-offset-4"
        >
          <Mail aria-hidden="true" className="size-4" />
          Need help choosing? Ask us
        </a>
      </div>

      <div className="divide-y divide-neutral-200 border-b border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {product.description ? (
          <details open className="pb-5">
            <summary className="cursor-pointer py-3 text-sm font-semibold">Product details</summary>
            <div className="pt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              <RichText data={product.description} enableGutter={false} />
            </div>
            <div
              className="grid max-w-lg grid-cols-3 gap-2 mt-5"
              aria-label="Honeylooms product qualities"
            >
              <Image
                src="/cotton.webp"
                alt="Made with cotton"
                width={1628}
                height={662}
                sizes="(max-width: 640px) 30vw, 170px"
                className="h-auto w-full"
              />
              <Image
                src="/handmade.webp"
                alt="Handmade"
                width={1641}
                height={662}
                sizes="(max-width: 640px) 30vw, 170px"
                className="h-auto w-full"
              />
              <Image
                src="/india.webp"
                alt="Made in India"
                width={1641}
                height={662}
                sizes="(max-width: 640px) 30vw, 170px"
                className="h-auto w-full"
              />
            </div>
          </details>
        ) : null}
        <details className="py-2">
          <summary className="cursor-pointer py-3 text-sm font-semibold">
            Delivery & payment
          </summary>
          <div className="space-y-3 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <p>
              Orders usually leave us within 1–2 business days. Pre-booked orders or pieces needing
              finishing may take longer.
            </p>
            <p>
              Prepaid shipping is free across India. Choose UPI at checkout, or cash on delivery
              with a ₹25 handling charge.
            </p>
            <Link
              href="/deliveries-and-returns"
              className="inline-block underline underline-offset-4"
            >
              Read the delivery policy
            </Link>
          </div>
        </details>
        <details className="py-2">
          <summary className="cursor-pointer py-3 text-sm font-semibold">
            Size exchanges & returns
          </summary>
          <div className="space-y-3 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <p>
              Report size issues or manufacturing defects within 48 hours of receiving your order.
              Items must be unworn, unwashed, undamaged and have their original tags.
            </p>
            <p>
              Size exchanges carry return courier charges. Final sale items, custom orders and gift
              cards cannot be returned or exchanged.
            </p>
            <Link
              href="/deliveries-and-returns"
              className="inline-block underline underline-offset-4"
            >
              Read the full returns policy
            </Link>
          </div>
        </details>
      </div>
    </div>
  )
}
