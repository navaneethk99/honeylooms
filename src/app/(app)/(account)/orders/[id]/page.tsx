import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
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

export const dynamic = 'force-dynamic'

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
            id: {
              equals: id,
            },
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
        status: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
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

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-100 dark:border-neutral-900">
        {user ? (
          <Link
            href="/orders"
            className="group flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors duration-300"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Back to orders</span>
          </Link>
        ) : (
          <div></div>
        )}

        <span className="text-xs uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500">
          {`Order #${order.id}`}
        </span>
      </div>

      <div className="flex flex-col gap-12">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-6 border-b border-neutral-100 dark:border-neutral-900">
          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
              Order Date
            </p>
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
              Total
            </p>
            {order.amount && (
              <Price className="text-base font-semibold font-mono" amount={order.amount} />
            )}
          </div>

          {order.status && (
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                Status
              </p>
              <OrderStatus status={order.status} />
            </div>
          )}
        </div>

        {/* Order Items */}
        {order.items && (
          <div className="pb-8 border-b border-neutral-100 dark:border-neutral-900">
            <h2 className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 mb-6">
              Items
            </h2>
            <ul className="flex flex-col gap-6">
              {order.items?.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return (
                    <div key={index} className="text-sm text-neutral-500">
                      This item is no longer available.
                    </div>
                  )
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li
                    key={item.id}
                    className="pb-6 border-b border-neutral-50 dark:border-neutral-950 last:pb-0 last:border-0"
                  >
                    <ProductItem
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div>
            <h2 className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
              Shipping Address
            </h2>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {/* @ts-expect-error - some kind of type hell */}
              <AddressItem address={order.shippingAddress} hideActions />
            </div>
          </div>
        )}
      </div>
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
