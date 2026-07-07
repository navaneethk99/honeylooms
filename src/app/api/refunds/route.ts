import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })

    const formData = await request.formData()
    const orderId = formData.get('orderId') as string
    const reason = formData.get('reason') as string
    const explanation = formData.get('explanation') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string
    const resolution = formData.get('resolution') as string
    const email = formData.get('email') as string
    const accessToken = formData.get('accessToken') as string

    if (!orderId || !reason || !explanation || !contactEmail || !contactPhone || !resolution) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Fetch the order to verify authorization
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // Verify ownership
    const orderCustomer = typeof order.customer === 'object' ? order.customer?.id : order.customer
    const userCustomerId = user ? user.id : null
    const isOwner = userCustomerId && orderCustomer === userCustomerId
    const isGuestOwner = !user && accessToken && order.accessToken === accessToken && order.customerEmail === email

    if (!isOwner && !isGuestOwner) {
      return NextResponse.json({ error: 'Unauthorized to request refund for this order.' }, { status: 403 })
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Refunds can only be requested for delivered/completed orders.' }, { status: 400 })
    }

    // Upload files to media collection
    const mediaIds: (string | number)[] = []
    const files = formData.getAll('images') as unknown as File[]
    const validFiles = files.filter(file => file && file.size > 0)

    if (validFiles.length < 3) {
      return NextResponse.json({ error: 'Please upload at least 3 images of the product.' }, { status: 400 })
    }

    for (const file of validFiles) {
      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const mediaDoc = await payload.create({
          collection: 'media',
          data: {
            alt: `Refund image for order ${orderId}`,
          },
          file: {
            name: `${crypto.randomUUID()}.${file.name ? file.name.split('.').pop() : 'jpg'}`,
            data: buffer,
            mimetype: file.type || 'image/jpeg',
            size: file.size,
          },
          overrideAccess: true,
        })
        mediaIds.push(mediaDoc.id)
      }
    }

    // Create the Refund request document
    const refund = await payload.create({
      collection: 'refunds',
      data: {
        order: order.id as any,
        reason: reason as any,
        explanation,
        contactEmail,
        contactPhone,
        resolution: resolution as any,
        images: mediaIds as any,
        status: 'pending',
      },
      overrideAccess: true,
    })

    // Update the order status to 'refund_requested'
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        status: 'refund_requested' as any,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true, refundId: refund.id })
  } catch (error: any) {
    console.error('Error creating refund request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
