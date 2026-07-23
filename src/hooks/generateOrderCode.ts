import type { FieldHook } from 'payload'
import { randomInt } from 'node:crypto'

const MIN_ORDER_CODE = 10_000_000
const MAX_ORDER_CODE_EXCLUSIVE = 100_000_000
const MAX_GENERATION_ATTEMPTS = 5

export const generateOrderCode: FieldHook = async ({ operation, req, value }) => {
  if (operation !== 'create' || value) {
    return value
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const orderCode = String(randomInt(MIN_ORDER_CODE, MAX_ORDER_CODE_EXCLUSIVE))
    const existingOrder = await req.payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        orderCode: {
          equals: orderCode,
        },
      },
    })

    if (existingOrder.totalDocs === 0) {
      return orderCode
    }
  }

  throw new Error('Unable to generate a unique order code.')
}
