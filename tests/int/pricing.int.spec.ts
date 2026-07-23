import { calculatePromoDiscount } from '@/utilities/pricing'
import { describe, expect, it } from 'vitest'

describe('calculatePromoDiscount', () => {
  it('recalculates a percentage discount from the current subtotal', () => {
    expect(
      calculatePromoDiscount({
        discountPercentage: 99.8,
        subtotal: 99_800,
      }),
    ).toBe(99_600)

    expect(
      calculatePromoDiscount({
        discountPercentage: 99.8,
        subtotal: 49_900,
      }),
    ).toBe(49_800)
  })

  it('honors the maximum discount amount', () => {
    expect(
      calculatePromoDiscount({
        discountPercentage: 50,
        maxDiscountAmount: 10_000,
        subtotal: 49_900,
      }),
    ).toBe(10_000)
  })

  it('never discounts more than the subtotal', () => {
    expect(
      calculatePromoDiscount({
        discountPercentage: 150,
        subtotal: 49_900,
      }),
    ).toBe(49_900)
  })
})
