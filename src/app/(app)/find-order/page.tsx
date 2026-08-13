import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'
import { FindOrderForm } from '@/components/forms/FindOrderForm'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers.js'
import { connection } from 'next/server'
import configPromise from '@payload-config'

export default async function FindOrderPage() {
  await connection()

  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  return (
    <section className="container py-12 sm:py-20">
      <div className="mx-auto max-w-xl">
        <FindOrderForm initialEmail={user?.email} />
      </div>
    </section>
  )
}

export const metadata: Metadata = {
  description: 'View your Honeylooms order status using your email address and order ID.',
  openGraph: mergeOpenGraph({
    title: 'Track your order',
    url: '/find-order',
  }),
  title: 'Track your order',
}
