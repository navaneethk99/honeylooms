import type { Product } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import {
  getEffectiveProductPrice,
  getOriginalProductPrice,
  isProductOnSale,
} from '@/utilities/pricing'

type Props = {
  product: Partial<Product>
  showShopCta?: boolean
}

export const ProductGridItem: React.FC<Props> = ({ product, showShopCta = false }) => {
  const { gallery, title } = product
  const salePrice = isProductOnSale(product) ? (product.salePrice ?? 0) : 0

  let price = getEffectiveProductPrice(product)
  let originalPrice = getOriginalProductPrice(product)

  const variants = product.variants?.docs

  if (!isProductOnSale(product) && variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      price = variant.priceInUSD
      originalPrice = variant.priceInUSD
    }
  }

  // Filter out any invalid gallery images
  const images =
    gallery?.filter(
      (
        item,
      ): item is NonNullable<NonNullable<Product['gallery']>[number]> & {
        image: Exclude<NonNullable<Product['gallery']>[number]['image'], string | number>
      } => Boolean(item?.image && typeof item.image === 'object'),
    ) ?? []

  const primaryImage = images[0]?.image
  const hoverImage = images[1]?.image

  // Get first category title if populated
  const firstCategory = product.categories?.[0]
  const categoryTitle =
    firstCategory && typeof firstCategory === 'object' && 'title' in firstCategory
      ? firstCategory.title
      : null

  return (
    <Link
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-none border border-neutral-100 hover:border-neutral-300 dark:border-neutral-900 dark:hover:border-neutral-800 bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
      href={`/products/${product.slug}`}
    >
      {/* Image container: sharp 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
        {!product.enableVariants && product.inventory === 0 ? (
          <span className="absolute left-2 top-2 z-10 bg-white/95 px-2 py-1 text-xs font-medium text-neutral-700">
            Sold out
          </span>
        ) : null}
        {primaryImage ? (
          <>
            <Media
              fill
              className="absolute inset-0"
              imgClassName={clsx(
                'object-cover p-0 transition-opacity duration-300 ease-in-out',
                hoverImage ? 'group-hover:opacity-0' : '',
              )}
              resource={primaryImage}
              size="(max-width: 767px) 50vw, (max-width: 1023px) 25vw, 33vw"
            />
            {hoverImage ? (
              <Media
                fill
                className="absolute inset-0"
                imgClassName="object-cover p-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                resource={hoverImage}
                size="(max-width: 767px) 50vw, (max-width: 1023px) 25vw, 33vw"
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            No Image
          </div>
        )}
      </div>

      {/* Details container: minimal, sharp layout with price display */}
      <div className="flex flex-col gap-1 px-3 py-3.5 border-t border-neutral-100 dark:border-neutral-900 transition-colors duration-300 group-hover:border-neutral-200 dark:group-hover:border-neutral-800">
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="font-sans text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-snug tracking-tight break-words group-hover:text-neutral-950 dark:group-hover:text-neutral-50 transition-colors duration-300">
              {title}
            </h3>
          </div>
          {typeof price === 'number' && (
            <div className="ml-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {isProductOnSale(product) ? (
                <div className="flex flex-col justify-center items-end">
                  <Price
                    amount={salePrice}
                    className="font-mono text-sm font-semibold text-black dark:text-red-400 tracking-tight"
                  />
                  <Price
                    amount={originalPrice}
                    className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 line-through tracking-tight"
                  />
                </div>
              ) : (
                <Price
                  amount={price}
                  className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight"
                />
              )}
            </div>
          )}
        </div>
        {showShopCta ? (
          <span className="mt-2 inline-flex w-full items-center justify-center bg-[#24231f] px-2 py-2 font-mono text-[10px] font-semibold tracking-wider text-white uppercase transition-colors group-hover:bg-[#3a3934]">
            View style & sizes
          </span>
        ) : null}
      </div>
    </Link>
  )
}
