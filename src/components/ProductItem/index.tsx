import { Media } from '@/components/Media'
import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Media as MediaType, Order, Product, Variant } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
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

  const itemPrice = variant?.priceInUSD || product.priceInUSD
  const itemURL = `/products/${product.slug}${variant ? `?variant=${variant.id}` : ''}`

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-stretch justify-stretch h-20 w-20 rounded-none border border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
        <div className="relative w-full h-full">
          {image && typeof image !== 'string' && (
            <Media className="" fill imgClassName="object-cover" resource={image} />
          )}
        </div>
      </div>
      <div className="flex grow justify-between items-center min-w-0 gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-medium hover:underline text-neutral-800 dark:text-neutral-200 truncate">
            <Link href={itemURL}>{title}</Link>
          </p>
          {variant && (
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500">
              {variant.options
                ?.map((option) => {
                  if (typeof option === 'object') return option.label
                  return null
                })
                .join(', ')}
            </p>
          )}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            Qty: {quantity}
          </div>
        </div>

        {itemPrice && quantity && (
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Subtotal</p>
            <Price
              className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100"
              amount={itemPrice * quantity}
              currencyCode={currencyCode}
            />
          </div>
        )}
      </div>
    </div>
  )
}
