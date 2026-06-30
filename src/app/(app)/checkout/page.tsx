import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Fragment } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <div className="container min-h-[90vh] flex">
      {(!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) && (
        <div>
          <Fragment>
            {'To enable checkout, you must '}
            <a
              href="https://www.cashfree.com/docs/payments/online/web/redirect"
              rel="noopener noreferrer"
              target="_blank"
            >
              configure your Cashfree credentials
            </a>
            {' then set them as environment variables. See the '}
            <a
              href="https://www.cashfree.com/docs/api-reference/payments/latest/orders/create"
              rel="noopener noreferrer"
              target="_blank"
            >
              Cashfree docs
            </a>
            {' for more details.'}
          </Fragment>
        </div>
      )}

      <h1 className="sr-only">Checkout</h1>

      <CheckoutPage />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Checkout.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}
