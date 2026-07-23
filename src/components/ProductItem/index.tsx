import { Media } from '@/components/Media'
import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Media as MediaType, Order, Product, Variant } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getEffectiveProductPrice } from '@/utilities/pricing'
import Link from 'next/link'

type Props = {
  product: Product
  style?: 'compact' | 'default'
  variant?: Variant
  quantity?: number
  /**
   * Force all formatting to a particular currency.
   */
  currencyCode?: string
}

export const ProductItem: React.FC<Props> = ({
  product,
  style = 'default',
  quantity,
  variant,
  currencyCode,
}) => {
  const { title } = product

  const metaImage =
    product.meta?.image && typeof product.meta?.image !== 'string' ? product.meta.image : undefined

  const firstGalleryImage =
    typeof product.gallery?.[0]?.image !== 'string' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage

  const isVariant = Boolean(variant) && typeof variant === 'object'

  if (isVariant) {
    const imageVariant = product.gallery?.find((item) => {
      if (!item.variantOption) return false
      const variantOptionID =
        typeof item.variantOption === 'object' ? item.variantOption.id : item.variantOption

      const hasMatch = variant?.options?.some((option) => {
        if (typeof option === 'object') return option.id === variantOptionID
        else return option === variantOptionID
      })

      return hasMatch
    })

    if (imageVariant && typeof imageVariant.image !== 'string') {
      image = imageVariant.image
    }
  }

  const itemPrice = getEffectiveProductPrice(product, variant)
  const itemURL = `/products/${product.slug}${variant ? `?variant=${variant.id}` : ''}`

  return (
    <div className="flex items-center gap-5">
      <div className="flex size-24 shrink-0 items-stretch justify-stretch overflow-hidden bg-[#ebe5da] sm:size-28">
        <div className="relative size-full">
          {image && typeof image !== 'string' && (
            <Media className="" fill imgClassName="object-cover" resource={image} />
          )}
        </div>
      </div>
      <div className="flex min-w-0 grow flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate text-base text-[#24231f] hover:underline">
            <Link href={itemURL}>{title}</Link>
          </p>
          {variant && (
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8c877d]">
              {variant.options
                ?.map((option) => {
                  if (typeof option === 'object') return option.label
                  return null
                })
                .join(', ')}
            </p>
          )}
          <div className="text-xs text-[#6c675d]">Quantity: {quantity}</div>
        </div>

        {itemPrice && quantity && (
          <div className="shrink-0 sm:text-right">
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#8c877d]">Subtotal</p>
            <Price
              className="text-sm text-[#24231f]"
              amount={itemPrice * quantity}
              currencyCode={currencyCode}
            />
          </div>
        )}
      </div>
    </div>
  )
}
