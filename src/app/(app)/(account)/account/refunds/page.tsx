import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { RefundForm } from '@/components/forms/RefundForm'
import { formatOrderReference } from '@/utilities/orderReference'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ orderId?: string; email?: string; accessToken?: string }>
}

export default async function RefundsPage({ searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { orderId = '', email = '', accessToken = '' } = await searchParams

  if (!orderId) {
    notFound()
  }

  let order: any = null

  try {
    const { docs } = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      where: {
        or: [{ orderCode: { equals: orderId } }, { id: { equals: orderId } }],
      },
    })
    const orderResult = docs[0]

    const orderCustomer =
      typeof orderResult.customer === 'object' ? orderResult.customer?.id : orderResult.customer
    const userCustomerId = user ? user.id : null

    const canAccessAsGuest =
      !user &&
      email &&
      accessToken &&
      orderResult &&
      orderResult.accessToken === accessToken &&
      orderResult.customerEmail === email

    const canAccessAsUser = user && orderResult && orderCustomer && orderCustomer === userCustomerId

    if (
      orderResult &&
      (canAccessAsGuest || canAccessAsUser) &&
      orderResult.status === 'completed'
    ) {
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-1.5 mb-8 pb-4 border-b border-neutral-100 dark:border-neutral-900">
        <Link
          href={`/orders/${orderReference}${email ? `?email=${encodeURIComponent(email)}&accessToken=${encodeURIComponent(accessToken)}` : ''}`}
          className="group flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors duration-300"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Back to Order</span>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-2">Request Return or Refund</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Please fill out the form below to request a return or refund for {orderReference}.
      </p>

      <RefundForm
        orderId={order.id}
        customerEmail={order.customerEmail || ''}
        customerPhone={order.shippingAddress?.phone || ''}
        accessToken={accessToken}
        email={email}
      />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Request Return/Refund',
  description: 'Submit a return or refund request for your order.',
}
