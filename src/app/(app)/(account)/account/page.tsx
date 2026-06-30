import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { AccountForm } from '@/components/forms/AccountForm'
import { Order } from '@/payload-types'
import { OrderItem } from '@/components/OrderItem'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  return (
    <div className="flex flex-col gap-16 w-full">
      <div className="pb-12 border-b border-neutral-100 dark:border-neutral-900">
        <h1 className="text-2xl font-semibold mb-6">Account Settings</h1>
        <AccountForm />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-100 dark:border-neutral-900">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Button asChild variant="link" className="px-0 text-sm hover:underline hover:no-underline underline-offset-4 text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 font-mono uppercase tracking-wider text-xs">
            <Link href="/orders">View all orders</Link>
          </Button>
        </div>

        <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          <p>
            These are the most recent orders you have placed. Each order is associated with a
            payment. As you place more orders, they will appear in your orders list.
          </p>
        </div>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="text-sm text-neutral-500 py-6">You have no orders.</p>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-4">
            {orders?.map((order) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
