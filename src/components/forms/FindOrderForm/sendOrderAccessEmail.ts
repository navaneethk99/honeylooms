'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { formatOrderReference, parseOrderReference } from '@/utilities/orderReference'

type SendOrderAccessEmailArgs = {
  email: string
  orderID: string
}

type SendOrderAccessEmailResult = {
  success: boolean
  error?: string
}

export async function sendOrderAccessEmail({
  email,
  orderID,
}: SendOrderAccessEmailArgs): Promise<SendOrderAccessEmailResult> {
  const payload = await getPayload({ config: configPromise })
  const internalOrderID = parseOrderReference(orderID)

  try {
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        and: [
          {
            or: [{ orderCode: { equals: internalOrderID } }, { id: { equals: internalOrderID } }],
          },
          { customerEmail: { equals: email } },
        ],
      },
      limit: 1,
      depth: 0,
    })

    const order = orders[0]

    if (!order || !order.accessToken) {
      return { success: true }
    }

    const serverURL = getServerSideURL()
    const orderURL = `${serverURL}/orders/${order.id}?email=${encodeURIComponent(email)}&accessToken=${order.accessToken}`
    const orderReference = formatOrderReference(order)

    const emailBody = `
        <h1>View Your Order</h1>
        <p>Click the link below to view your order details:</p>
        <p><a href="${orderURL}">View Order ${orderReference}</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${orderURL}</p>
        <p>This link will give you access to view your order details.</p>
      `

    console.log('[sendOrderAccessEmail] Email body:', emailBody)

    await payload.sendEmail({
      to: email,
      subject: `Access your order ${orderReference}`,
      html: emailBody,
    })

    return { success: true }
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send order access email', err })
    return { success: true }
  }
}
