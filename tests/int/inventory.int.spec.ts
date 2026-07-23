import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

const randomId = () => Math.random().toString(36).substring(2, 8)

describe('Inventory Reduction on Purchase', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  }, 30000)

  it('should reduce stock for standard product', async () => {
    const id = randomId()
    // 1. Create a product with a set inventory
    const product = await payload.create({
      collection: 'products',
      data: {
        title: `Int Test Standard Product ${id}`,
        slug: `int-test-standard-product-${id}`,
        inventory: 15,
        _status: 'published',
      },
      context: { disableRevalidate: true },
    })

    expect(product.inventory).toBe(15)

    // 2. Create an order that purchases 3 of this product
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderCode: '',
        items: [
          {
            product: product.id,
            quantity: 3,
          },
        ],
        status: 'processing',
      },
      context: { disableRevalidate: true },
    })

    // 3. Verify the product inventory is decremented by 3 (15 - 3 = 12)
    const updatedProduct = await payload.findByID({
      collection: 'products',
      id: product.id,
    })

    expect(updatedProduct.inventory).toBe(12)

    // Clean up
    await payload.delete({
      collection: 'orders',
      id: order.id,
      context: { disableRevalidate: true },
    })
    await payload.delete({
      collection: 'products',
      id: product.id,
      context: { disableRevalidate: true },
    })
  })

  it('should reduce stock for product variant', async () => {
    const id = randomId()
    // 1. Create a variant type and option to satisfy schema validation
    const variantType = await payload.create({
      collection: 'variantTypes',
      data: {
        name: `test-size-${id}`,
        label: `Test Size ${id}`,
      },
      context: { disableRevalidate: true },
    })

    const variantOption = await payload.create({
      collection: 'variantOptions',
      data: {
        value: `test-large-${id}`,
        label: `Test Large ${id}`,
        variantType: variantType.id,
      },
      context: { disableRevalidate: true },
    })

    // 2. Create a product that will support variants
    const product = await payload.create({
      collection: 'products',
      data: {
        title: `Int Test Variant Product ${id}`,
        slug: `int-test-variant-product-${id}`,
        enableVariants: true,
        variantTypes: [variantType.id],
        _status: 'published',
      },
      context: { disableRevalidate: true },
    })

    // 3. Create a variant for this product with a set inventory and options
    const variant = await payload.create({
      collection: 'variants',
      data: {
        product: product.id,
        inventory: 8,
        options: [variantOption.id],
        _status: 'published',
      },
      context: { disableRevalidate: true },
    })

    expect(variant.inventory).toBe(8)

    // 4. Create an order that purchases 2 of this variant
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderCode: '',
        items: [
          {
            product: product.id,
            variant: variant.id,
            quantity: 2,
          },
        ],
        status: 'processing',
      },
      context: { disableRevalidate: true },
    })

    // 5. Verify the variant inventory is decremented by 2 (8 - 2 = 6)
    const updatedVariant = await payload.findByID({
      collection: 'variants',
      id: variant.id,
    })

    expect(updatedVariant.inventory).toBe(6)

    // Clean up
    await payload.delete({
      collection: 'orders',
      id: order.id,
      context: { disableRevalidate: true },
    })
    await payload.delete({
      collection: 'variants',
      id: variant.id,
      context: { disableRevalidate: true },
    })
    await payload.delete({
      collection: 'products',
      id: product.id,
      context: { disableRevalidate: true },
    })
    await payload.delete({
      collection: 'variantOptions',
      id: variantOption.id,
      context: { disableRevalidate: true },
    })
    await payload.delete({
      collection: 'variantTypes',
      id: variantType.id,
      context: { disableRevalidate: true },
    })
  })
})
