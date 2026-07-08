'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getEffectiveProductPrice, getOriginalProductPrice } from '@/utilities/pricing'

export interface SearchableProduct {
  id: string | number
  title: string
  slug: string | null
  price: number
  originalPrice: number
  hasDiscount: boolean
  imageUrl: string | null
  imageAlt: string
  description?: string | null
}

function extractPlainTextFromLexical(richText: any): string {
  if (!richText || typeof richText !== 'object') return ''

  let text = ''

  function traverse(node: any) {
    if (!node) return
    if (node.text && typeof node.text === 'string') {
      text += node.text
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  if (richText.root) {
    traverse(richText.root)
  } else if (Array.isArray(richText)) {
    richText.forEach(traverse)
  }

  return text.trim()
}

export async function getSearchableProducts(): Promise<SearchableProduct[]> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 250,
    select: {
      title: true,
      slug: true,
      description: true,
      priceInUSD: true,
      salePrice: true,
      onSale: true,
      gallery: true,
      meta: true,
      variants: true,
    },
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs.map((doc) => {
    const metaImage = doc.meta?.image && typeof doc.meta.image === 'object' ? doc.meta.image : undefined
    const galleryImage = doc.gallery?.[0]?.image && typeof doc.gallery[0].image === 'object' ? doc.gallery[0].image : undefined
    const image = galleryImage || metaImage

    const plainTextDescription = extractPlainTextFromLexical(doc.description)
    const fallbackDescription = doc.meta?.description || ''

    const price = getEffectiveProductPrice(doc)
    const originalPrice = getOriginalProductPrice(doc)
    const hasDiscount = Boolean(doc.onSale && doc.salePrice && originalPrice > price)

    return {
      id: doc.id,
      title: doc.title,
      slug: doc.slug || null,
      price,
      originalPrice,
      hasDiscount,
      imageUrl: image?.url ? getMediaUrl(image.url) : null,
      imageAlt: image?.alt || doc.title || '',
      description: plainTextDescription || fallbackDescription || '',
    }
  })
}
