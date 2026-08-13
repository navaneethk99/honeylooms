import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/ProductItem'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderStatus } from '@/components/OrderStatus'
import { AddressItem } from '@/components/addresses/AddressItem'
import { formatOrderReference } from '@/utilities/orderReference'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 2,
      where: {
        and: [
          {
            or: [
              {
                orderCode: {
                  equals: id,
                },
              },
              {
                id: {
                  equals: id,
                },
              },
            ],
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : [
                {
                  accessToken: {
                    equals: accessToken,
                  },
                },
                ...(email
                  ? [
                      {
                        customerEmail: {
                          equals: email,
                        },
                      },
                    ]
                  : []),
              ]),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerEmail: true,
        customer: true,
        orderCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
        shippingLink: true,
      },
    })

    const canAccessAsGuest =
      !user &&
      email &&
      accessToken &&
      orderResult &&
      orderResult.customerEmail &&
      orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch (error) {
    console.error(error)
  }

  if (!order) {
    notFound()
  }

  const orderReference = formatOrderReference(order)

  return (
    <div className="w-full">
      {user ? (
        <div className="mb-8">
          <Link
            href="/orders"
            className="group inline-flex items-center gap-1.5 text-xs text-[#6c675d] transition-colors hover:text-[#24231f]"
          >
            <ChevronLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to orders</span>
          </Link>
        </div>
      ) : null}

      <header className="border-b border-[#24231f]/20 pb-8">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#8a682f]">Order details</p>
        <h1 className="font-dream-orphanage text-[clamp(2rem,8vw,3.75rem)] leading-none font-normal tracking-[-0.04em] whitespace-nowrap text-[#24231f]">
          {orderReference}
        </h1>
      </header>

      <dl className="grid border-b border-[#24231f]/20 sm:grid-cols-3">
        <div className="border-b border-[#24231f]/15 py-6 sm:border-r sm:border-b-0 sm:px-6 sm:first:pl-0">
          <dt className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#8c877d]">
            Order date
          </dt>
          <dd className="text-base text-[#24231f]">
            <time dateTime={order.createdAt}>
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </dd>
        </div>

        <div className="border-b border-[#24231f]/15 py-6 sm:border-r sm:border-b-0 sm:px-6">
          <dt className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#8c877d]">Total</dt>
          <dd>
            {order.amount ? (
              <Price
                className="text-base text-[#24231f]"
                amount={order.amount}
                currencyCode={order.currency ?? undefined}
              />
            ) : null}
          </dd>
        </div>

        <div className="py-6 sm:pl-6">
          <dt className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#8c877d]">Status</dt>
          <dd className="flex flex-col items-start gap-2">
            {order.status ? <OrderStatus className="text-sm" status={order.status} /> : null}
            {order.status === 'shipped' && order.shippingLink ? (
              <a
                href={order.shippingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#8a682f] underline underline-offset-4"
              >
                Track shipment
              </a>
            ) : null}
          </dd>
        </div>
      </dl>

      <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        {order.items ? (
          <section>
            <h2 className="mb-5 font-dream-orphanage text-3xl font-normal text-[#24231f]">Items</h2>
            <ul className="border-t border-[#24231f]/20">
              {order.items.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return (
                    <li
                      key={item.id ?? index}
                      className="border-b border-[#24231f]/20 py-6 text-sm text-[#6c675d]"
                    >
                      This item is no longer available.
                    </li>
                  )
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li key={item.id} className="border-b border-[#24231f]/20 py-6">
                    <ProductItem
                      currencyCode={order.currency ?? undefined}
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {order.shippingAddress ? (
          <aside>
            <h2 className="mb-5 font-dream-orphanage text-3xl font-normal text-[#24231f]">
              Shipping address
            </h2>
            <div className="border-y border-[#24231f]/20 py-5">
              {/* @ts-expect-error - Payload's generated order address type differs from Address */}
              <AddressItem address={order.shippingAddress} hideActions />
            </div>
          </aside>
        ) : null}
      </div>

      {order.status === 'completed' ? (
        <div className="flex justify-end border-t border-[#24231f]/20 pt-6">
          <Link
            href={`/account/refunds?orderId=${orderReference}${email ? `&email=${encodeURIComponent(email)}` : ''}${accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : ''}`}
            className="text-sm text-[#6c675d] underline underline-offset-4 transition-colors hover:text-[#24231f]"
          >
            Request a return or refund
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}
