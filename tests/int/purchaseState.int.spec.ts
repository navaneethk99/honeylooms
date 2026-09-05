import { describe, expect, it } from 'vitest'

import type { Cart, Product, Variant } from '@/payload-types'
import { getPurchaseState, getSelectedVariant } from '@/components/product/purchaseState'

const product = { id: 1, inventory: 2 } as Product
const variant = { id: 5, inventory: 3 } as Variant

describe('Product purchase states', () => {
  it('allows available stock to be added', () => {
    expect(getPurchaseState(product, undefined)).toMatchObject({
      disabled: false,
      outOfStock: false,
    })
  })

  it('distinguishes all stock already in the bag from a sold-out product', () => {
    const cart = {
      items: [
        { product: 1, quantity: 1 },
        { product: 1, quantity: 1 },
      ],
    } as Cart
    expect(getPurchaseState(product, undefined, cart)).toMatchObject({
      disabled: true,
      atCartLimit: true,
      outOfStock: false,
    })
  })

  it('requires a size and does not accept unknown variant IDs', () => {
    const withVariants = { ...product, enableVariants: true, variants: { docs: [variant] } }
    expect(getSelectedVariant(withVariants, 'unknown')).toBeUndefined()
    expect(getSelectedVariant(withVariants, '5')).toBe(variant)
    expect(getPurchaseState(withVariants, undefined)).toMatchObject({
      needsSelection: true,
      disabled: true,
      outOfStock: false,
    })
  })

  it('counts only the selected size when checking bag limits', () => {
    const withVariants = { ...product, enableVariants: true, variants: { docs: [variant] } }
    const cart = {
      items: [
        { product: 1, variant: 6, quantity: 3 },
        { product: { id: 1 }, variant: { id: 5 }, quantity: 1 },
      ],
    } as Cart
    expect(getPurchaseState(withVariants, variant, cart)).toMatchObject({
      disabled: false,
      quantityInCart: 1,
    })
  })

  it('disables missing or zero inventory', () => {
    expect(getPurchaseState({ ...product, inventory: null }, undefined)).toMatchObject({
      outOfStock: true,
      disabled: true,
    })
    expect(
      getPurchaseState({ ...product, enableVariants: true }, { ...variant, inventory: 0 }),
    ).toMatchObject({ outOfStock: true, disabled: true })
  })
})
