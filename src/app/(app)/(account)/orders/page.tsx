import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { OrderItem } from '@/components/OrderItem'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function Orders() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your orders.')}`)
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {}

  return (
    <div className="w-full">
      <h1 className="mb-8 border-b border-[#24231f]/20 pb-4 font-editorial text-4xl tracking-[-0.03em] text-[#24231f]">
        Orders
      </h1>

      {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
        <p className="py-6 text-sm text-[#6c675d]">You have no orders.</p>
      )}

      {orders && orders.length > 0 && (
        <ul className="border-t border-[#24231f]/20">
          {orders?.map((order) => (
            <li key={order.id}>
              <OrderItem order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
