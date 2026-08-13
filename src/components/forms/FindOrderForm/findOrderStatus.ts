'use server'

import configPromise from '@payload-config'
import type { OrderStatus } from '@/payload-types'
import { parseOrderReference } from '@/utilities/orderReference'
import { getPayload } from 'payload'

type FindOrderStatusArgs = {
  email: string
  orderID: string
}

export type OrderStatusResult =
  | {
      success: true
      order: {
        createdAt: string
        orderCode: string
        shippingLink?: string | null
        status: OrderStatus
      }
    }
  | {
      success: false
      error: string
    }

const NOT_FOUND_MESSAGE =
  'We could not find an order matching that order ID and email address. Please check both and try again.'

export async function findOrderStatus({
  email,
  orderID,
}: FindOrderStatusArgs): Promise<OrderStatusResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const orderReference = parseOrderReference(orderID)

  if (!/^\d{8}$/.test(orderReference) || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return { success: false, error: NOT_FOUND_MESSAGE }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'orders',
      // This server action is the access boundary. Only the fields below are returned,
      // and only after both guest-supplied identifiers match the same order.
      overrideAccess: true,
      depth: 0,
      limit: 1,
      pagination: false,
      select: {
        createdAt: true,
        orderCode: true,
        shippingLink: true,
        status: true,
      },
      where: {
        and: [
          { orderCode: { equals: orderReference } },
          { customerEmail: { equals: normalizedEmail } },
        ],
      },
    })

    const order = docs[0]

    if (!order?.status) {
      return { success: false, error: NOT_FOUND_MESSAGE }
    }

    return {
      success: true,
      order: {
        createdAt: order.createdAt,
        orderCode: order.orderCode,
        shippingLink: order.shippingLink,
        status: order.status,
      },
    }
  } catch (error) {
    const payload = await getPayload({ config: configPromise })
    payload.logger.error({ msg: 'Failed to look up guest order status', err: error })

    return {
      success: false,
      error: 'We could not check your order right now. Please try again in a moment.',
    }
  }
}
