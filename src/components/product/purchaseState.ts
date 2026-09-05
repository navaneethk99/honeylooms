import type { Cart, Product, Variant } from '@/payload-types'

export const getProductVariants = (product: Product): Variant[] =>
  product.variants?.docs?.filter(
    (variant): variant is Variant => typeof variant === 'object' && variant !== null,
  ) ?? []

export const getSelectedVariant = (product: Product, variantID: string | null) =>
  product.enableVariants
    ? getProductVariants(product).find((variant) => String(variant.id) === variantID)
    : undefined

export const getPurchaseState = (
  product: Product,
  selectedVariant: Variant | undefined,
  cart?: Cart | null,
) => {
  const quantityInCart =
    cart?.items?.reduce((total, item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = typeof item.variant === 'object' ? item.variant?.id : item.variant
      const matches =
        productID === product.id && (!product.enableVariants || variantID === selectedVariant?.id)
      return total + (matches ? item.quantity || 0 : 0)
    }, 0) ?? 0
  const stock = (product.enableVariants ? selectedVariant?.inventory : product.inventory) ?? 0
  const needsSelection = Boolean(product.enableVariants && !selectedVariant)
  const outOfStock = needsSelection
    ? !getProductVariants(product).some((variant) => (variant.inventory ?? 0) > 0)
    : stock <= 0
  const atCartLimit = !needsSelection && !outOfStock && quantityInCart >= stock

  return {
    atCartLimit,
    disabled: needsSelection || outOfStock || atCartLimit,
    needsSelection,
    outOfStock,
    quantityInCart,
    stock,
  }
}
