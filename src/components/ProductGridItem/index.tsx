import type { Product, Variant } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, priceInUSD, title } = product

  let price = priceInUSD

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      price = variant.priceInUSD
    }
  }

  // Filter out any invalid gallery images
  const images =
    gallery?.filter(
      (item): item is NonNullable<NonNullable<Product['gallery']>[number]> & {
        image: Exclude<NonNullable<Product['gallery']>[number]['image'], string | number>
      } => Boolean(item?.image && typeof item.image !== 'string'),
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
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-none border border-neutral-100 hover:border-neutral-300 dark:border-neutral-900 dark:hover:border-neutral-800 bg-background"
      href={`/products/${product.slug}`}
    >
      {/* Image container: sharp 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
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
              size="(max-width: 768px) 100vw, 33vw"
            />
            {hoverImage ? (
              <Media
                fill
                className="absolute inset-0"
                imgClassName="object-cover p-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                resource={hoverImage}
                size="(max-width: 768px) 100vw, 33vw"
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            {/*{categoryTitle && (
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-mono">
                {categoryTitle}
              </span>
            )}*/}
            <h3 className="font-sans text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-snug tracking-tight truncate group-hover:text-neutral-950 dark:group-hover:text-neutral-50 transition-colors duration-300">
              {title}
            </h3>
          </div>

          {/* Price / Cost of the item */}
          {typeof price === 'number' && (
            <Price
              amount={price}
              className="shrink-0 font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight"
            />
          )}
        </div>
      </div>
    </Link>
  )
}

