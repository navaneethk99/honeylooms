import type { Product } from '@/payload-types'

import { getProductVariants } from '@/components/product/purchaseState'
import { getEffectiveProductPrice } from './pricing'
import { getCanonicalURL, getDocumentPath } from './seo'
import { getMediaUrl } from './getMediaUrl'

const plainText = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''
  const node = value as { children?: unknown[]; root?: unknown; text?: string }
  if (typeof node.text === 'string') return node.text
  if (node.root) return plainText(node.root)
  return node.children?.map(plainText).join(' ') || ''
}

export const getProductDescription = (product: Product) =>
  product.meta?.description ||
  plainText(product.description).replace(/\s+/g, ' ').trim().slice(0, 160) ||
  `Discover ${product.title} from Honeylooms. Explore product details, choose your size and shop with free prepaid shipping across India.`

export function getProductStructuredData(
  product: Product,
  { averageRating, reviewCount }: { averageRating?: number; reviewCount: number },
) {
  const url = getCanonicalURL(getDocumentPath('products', product.slug))
  const variants = product.enableVariants ? getProductVariants(product) : []
  const images = [
    product.meta?.image,
    ...(product.gallery?.map(({ image }) => image) || []),
  ].flatMap((image) =>
    typeof image === 'object' && image?.url ? [getCanonicalURL(getMediaUrl(image.url))] : [],
  )
  const offer = (amount: number, inventory: number | null | undefined, variantID?: number) => ({
    '@type': 'Offer',
    availability:
      (inventory || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    // Storage retains the legacy USD field name; these values are INR paise.
    price: (amount / 100).toFixed(2),
    priceCurrency: 'INR',
    url: variantID === undefined ? url : `${url}?variant=${variantID}`,
    seller: { '@type': 'Organization', name: 'Honeylooms' },
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: getProductDescription(product),
    image: Array.from(new Set(images)),
    url,
    sku: String(product.id),
    brand: { '@type': 'Brand', name: 'Honeylooms' },
    ...(product.enableVariants && !variants.length
      ? {}
      : {
          offers: variants.length
            ? variants.map((variant) =>
                offer(getEffectiveProductPrice(product, variant), variant.inventory, variant.id),
              )
            : offer(getEffectiveProductPrice(product), product.inventory),
        }),
    ...(averageRating !== undefined && reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(averageRating.toFixed(1)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }
}
