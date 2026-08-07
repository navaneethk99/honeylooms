import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import {
  getEffectiveProductPrice,
  getOriginalProductPrice,
  isProductOnSale,
} from '@/utilities/pricing'
import Link from 'next/link'

type Props = {
  product: Product
}

export function HomepageProductCard({ product }: Props) {
  const images =
    product.gallery?.filter(
      (
        item,
      ): item is NonNullable<NonNullable<Product['gallery']>[number]> & {
        image: Exclude<NonNullable<Product['gallery']>[number]['image'], string | number>
      } => Boolean(item?.image && typeof item.image === 'object'),
    ) ?? []

  const primaryImage = images[0]?.image
  const hoverImage = images[1]?.image
  const onSale = isProductOnSale(product)
  const price = getEffectiveProductPrice(product)
  const originalPrice = getOriginalProductPrice(product)

  return (
    <Link className="group block min-w-0" href={`/products/${product.slug}`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-[#e8e4dc]">
        {primaryImage ? (
          <>
            <Media
              fill
              className="absolute inset-0"
              imgClassName={`object-cover transition duration-700 ease-out group-hover:scale-[1.025] ${
                hoverImage ? 'group-hover:opacity-0' : ''
              }`}
              resource={primaryImage}
              size="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
            {hoverImage ? (
              <Media
                fill
                className="absolute inset-0"
                imgClassName="object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.025] group-hover:opacity-100"
                resource={hoverImage}
                size="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            ) : null}
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Image coming soon
          </div>
        )}

        {/*<span className="absolute left-3 top-3 bg-white/95 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-[#24231f]">
          {onSale ? 'Special price' : 'New arrival'}
        </span>*/}
      </div>

      <div className="flex items-start justify-between gap-3 pt-3.5 text-[#24231f]">
        <h3 className="min-w-0 text-[13px] leading-snug tracking-[0.01em] transition-opacity group-hover:opacity-60 sm:text-sm">
          {product.title}
        </h3>
        {typeof price === 'number' ? (
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <Price amount={price} className="text-xs font-medium sm:text-sm" />
            {onSale ? (
              <Price amount={originalPrice} className="text-[10px] text-stone-400 line-through" />
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
