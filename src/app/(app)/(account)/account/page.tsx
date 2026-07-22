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
    <div className="flex w-full flex-col gap-12">
      <section className="border-b border-[#24231f]/20 pb-10">
        <h1 className="mb-8 font-editorial text-4xl tracking-[-0.03em] text-[#24231f]">Account</h1>
        <AccountForm />
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between border-b border-[#24231f]/20 pb-4">
          <h2 className="font-editorial text-2xl text-[#24231f]">Recent orders</h2>
          <Button
            asChild
            variant="link"
            className="h-auto rounded-none px-0 text-sm text-[#5d594f] underline underline-offset-4"
          >
            <Link href="/orders">View all orders</Link>
          </Button>
        </div>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <p className="py-7 text-sm text-[#6c675d]">You have no orders yet.</p>
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
      </section>
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
