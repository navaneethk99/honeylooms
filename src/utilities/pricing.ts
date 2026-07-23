import type { PayloadRequest } from 'payload'

import type { Product, Variant } from '@/payload-types'

type MaybeProduct = Partial<Product> | null | undefined
type MaybeVariant = Partial<Variant> | null | undefined

export const calculatePromoDiscount = ({
  discountPercentage,
  maxDiscountAmount,
  subtotal,
}: {
  discountPercentage: number
  maxDiscountAmount?: number | null
  subtotal: number
}): number => {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0
  const safePercentage = Number.isFinite(discountPercentage)
    ? Math.min(100, Math.max(0, discountPercentage))
    : 0
  const percentageDiscount = Math.round(safeSubtotal * (safePercentage / 100))
  const safeMaximum =
    typeof maxDiscountAmount === 'number' && Number.isFinite(maxDiscountAmount)
      ? Math.max(0, maxDiscountAmount)
      : safeSubtotal

  return Math.min(safeSubtotal, percentageDiscount, safeMaximum)
}

export const getEffectiveProductPrice = (product: MaybeProduct, variant?: MaybeVariant): number => {
  if (product?.onSale && typeof product.salePrice === 'number') {
    return product.salePrice
  }

  if (variant && typeof variant.priceInUSD === 'number') {
    return variant.priceInUSD
  }

  if (typeof product?.priceInUSD === 'number') {
    return product.priceInUSD
  }

  return 0
}

export const getOriginalProductPrice = (product: MaybeProduct, variant?: MaybeVariant): number => {
  if (variant && typeof variant.priceInUSD === 'number') {
    return variant.priceInUSD
  }

  if (typeof product?.priceInUSD === 'number') {
    return product.priceInUSD
  }

  const variantPrices =
    product?.variants?.docs
      ?.filter((entry): entry is Variant => typeof entry === 'object' && entry !== null)
      .map((entry) => entry.priceInUSD)
      .filter((value): value is number => typeof value === 'number') ?? []

  if (variantPrices.length > 0) {
    return Math.min(...variantPrices)
  }

  return 0
}

export const isProductOnSale = (product: MaybeProduct): boolean => {
  if (!product?.onSale) return false
  return typeof product.salePrice === 'number'
}

export const calculateCartSubtotalFromItems = (
  items?: Array<{
    product?: MaybeProduct
    quantity?: number | null
    variant?: MaybeVariant
  }> | null,
): number => {
  if (!items?.length) return 0

  return items.reduce((subtotal, item) => {
    const quantity = Number(item.quantity || 0)
    const price = getEffectiveProductPrice(item.product, item.variant)

    return subtotal + price * quantity
  }, 0)
}

export const calculateCartSubtotalFromStoredItems = async (
  req: PayloadRequest,
  items?: Array<{
    product?: number | string | MaybeProduct
    quantity?: number | null
    variant?: number | string | MaybeVariant
  }> | null,
): Promise<number> => {
  if (!items?.length) return 0

  let subtotal = 0

  for (const item of items) {
    const productID = typeof item.product === 'object' ? item.product?.id : item.product
    const variantID = typeof item.variant === 'object' ? item.variant?.id : item.variant
    const quantity = Number(item.quantity || 0)

    if (!productID || quantity <= 0) continue

    const product = await req.payload.findByID({
      collection: 'products',
      id: productID,
      req,
    })

    if (!product) continue

    const variant =
      variantID && product.variants?.docs
        ? (product.variants.docs.find(
            (entry: any) => entry?.id === variantID || entry?._id === variantID,
          ) as Variant | undefined)
        : undefined

    subtotal += getEffectiveProductPrice(product, variant) * quantity
  }

  return subtotal
}
