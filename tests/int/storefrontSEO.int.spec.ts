import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Product } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { getProductStructuredData } from '@/utilities/productSEO'
import { createPageMetadata, getDocumentPath } from '@/utilities/seo'

const product = {
  id: 42,
  title: 'Cotton kurti',
  slug: 'cotton-kurti',
  _status: 'published',
  priceInUSD: 99900,
  inventory: 3,
  onSale: true,
  salePrice: 49900,
} as Product

afterEach(() => vi.unstubAllEnvs())

describe('Storefront search metadata', () => {
  it('keeps product and collection canonicals separate from the homepage', () => {
    expect(getDocumentPath('products', 'cotton-kurti')).toBe('/products/cotton-kurti')
    expect(getDocumentPath('collections', 'summer')).toBe('/collections/summer')
    expect(getDocumentPath('pages', 'about')).toBe('/about')
    expect(getDocumentPath('pages', 'home')).toBe('/')
  })

  it('uses one brand suffix and identical search/share URLs', () => {
    vi.stubEnv('DOMAIN_NAME', 'https://www.honeylooms.in')
    const meta = createPageMetadata({
      title: 'Cotton kurti | Honeylooms',
      description: 'Cotton clothing',
      path: '/products/cotton-kurti',
    })
    expect(meta.title).toEqual({ absolute: 'Cotton kurti | Honeylooms' })
    expect(meta.alternates?.canonical).toBe('https://www.honeylooms.in/products/cotton-kurti')
    expect(meta.openGraph?.url).toBe(meta.alternates?.canonical)
  })

  it('prevents preview deployments and drafts from being indexed', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const meta = createPageMetadata({ title: 'Shop', description: 'Clothing', path: '/shop' })
    expect(meta.robots).toMatchObject({ index: false, follow: false })
    vi.stubEnv('VERCEL_ENV', 'production')
    const draft = await generateMeta({
      collection: 'products',
      doc: { ...product, _status: 'draft' },
    })
    expect(draft.robots).toMatchObject({ index: false })
  })

  it('supports noindex search results while retaining crawlable product links', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const meta = createPageMetadata({
      title: 'Shop',
      description: 'Clothing',
      path: '/shop',
      noIndex: true,
    })
    expect(meta.robots).toMatchObject({ index: false, follow: true })
  })
})

describe('Product structured data matches the storefront', () => {
  it('publishes the sale price as rupees, not USD or paise', () => {
    const schema = getProductStructuredData(product, { reviewCount: 0 })
    expect(schema.offers).toMatchObject({
      price: '499.00',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    })
    expect(schema).not.toHaveProperty('aggregateRating')
  })

  it('describes each variant price and its own availability', () => {
    const schema = getProductStructuredData(
      {
        ...product,
        onSale: false,
        enableVariants: true,
        variants: {
          docs: [
            { id: 1, priceInUSD: 99900, inventory: 2 },
            { id: 2, priceInUSD: 109900, inventory: 0 },
          ],
        },
      } as Product,
      { reviewCount: 2, averageRating: 4.5 },
    )
    expect(schema.offers).toMatchObject([
      { price: '999.00', availability: 'https://schema.org/InStock' },
      { price: '1099.00', availability: 'https://schema.org/OutOfStock' },
    ])
    expect(schema.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 2 })
  })

  it('does not invent an offer for a variant product with no available variant records', () => {
    const schema = getProductStructuredData(
      { ...product, enableVariants: true, variants: { docs: [1] } },
      { reviewCount: 0 },
    )
    expect(schema).not.toHaveProperty('offers')
  })

  it('turns rich text descriptions into plain text', () => {
    const schema = getProductStructuredData(
      {
        ...product,
        description: {
          root: {
            type: 'root',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            children: [{ type: 'paragraph', version: 1, children: [{ text: 'Soft cotton.' }] }],
          },
        },
      },
      { reviewCount: 0 },
    )
    expect(schema.description).toBe('Soft cotton.')
  })
})
