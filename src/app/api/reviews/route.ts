import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { REST_GET, REST_OPTIONS } from '@payloadcms/next/routes'

import configPromise from '@payload-config'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })
    const formData = await request.formData()
    const orderId = formData.get('orderId')?.toString()
    const productId = Number(formData.get('productId'))
    const rating = Number(formData.get('rating'))
    const review = formData.get('review')?.toString().trim()
    const email = formData.get('email')?.toString()
    const accessToken = formData.get('accessToken')?.toString()

    if (
      !orderId ||
      !Number.isInteger(productId) ||
      productId < 1 ||
      !review ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ error: 'Please provide a rating and written review.' }, { status: 400 })
    }

    if (review.length > 2000) {
      return NextResponse.json({ error: 'Reviews must be 2,000 characters or fewer.' }, { status: 400 })
    }

    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
    const orderCustomer = typeof order.customer === 'object' ? order.customer?.id : order.customer
    const isOwner = Boolean(user && orderCustomer === user.id)
    const isGuestOwner = Boolean(
      !user && accessToken && email && order.accessToken === accessToken && order.customerEmail === email,
    )

    if (!isOwner && !isGuestOwner) {
      return NextResponse.json({ error: 'You are not authorized to review this order.' }, { status: 403 })
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Products can be reviewed once an order is completed.' }, { status: 400 })
    }

    const containsProduct = order.items?.some((item) => {
      const itemProduct = typeof item.product === 'object' ? item.product?.id : item.product
      return itemProduct === productId
    })

    if (!containsProduct) {
      return NextResponse.json({ error: 'This product is not part of the order.' }, { status: 400 })
    }

    if (!order.customerEmail) {
      return NextResponse.json({ error: 'This order has no customer email address.' }, { status: 400 })
    }

    const existing = await payload.find({
      collection: 'reviews',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { order: { equals: order.id } },
          { product: { equals: productId } },
        ],
      },
    })

    if (existing.totalDocs > 0) {
      return NextResponse.json({ error: 'You have already reviewed this product from this order.' }, { status: 409 })
    }

    const files = (formData.getAll('images') as File[]).filter((file) => file.size > 0)
    if (files.length > MAX_IMAGES) {
      return NextResponse.json({ error: `You can attach up to ${MAX_IMAGES} images.` }, { status: 400 })
    }
    if (files.some((file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE)) {
      return NextResponse.json({ error: 'Images must be under 5 MB and use a valid image format.' }, { status: 400 })
    }

    const imageIds: number[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const extension = file.name.split('.').pop() || 'jpg'
      const media = await payload.create({
        collection: 'media',
        data: { alt: `Customer review image for order ${orderId}` },
        file: {
          data: buffer,
          mimetype: file.type,
          name: `${crypto.randomUUID()}.${extension}`,
          size: file.size,
        },
        overrideAccess: true,
      })
      imageIds.push(media.id)
    }

    const createdReview = await payload.create({
      collection: 'reviews',
      data: {
        customer: user?.id,
        customerEmail: order.customerEmail,
        images: imageIds,
        order: order.id,
        product: productId,
        rating,
        review,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ id: createdReview.id, success: true })
  } catch (error) {
    console.error('Error creating review:', error)
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this product from this order.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Unable to submit your review.' }, { status: 500 })
  }
}

type RouteContext = { params: Promise<Record<string, never>> }

export async function GET(request: Request, context: RouteContext) {
  return REST_GET(configPromise)(request, {
    ...context,
    params: Promise.resolve({ slug: ['reviews'] }),
  })
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return REST_OPTIONS(configPromise)(request, {
    ...context,
    params: Promise.resolve({ slug: ['reviews'] }),
  })
}
