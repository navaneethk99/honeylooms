import type { Metadata } from 'next'
import React from 'react'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function DeliveriesAndReturnsPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
        Return Policy
      </h1>
      <div className="text-neutral-600 dark:text-neutral-400 space-y-4 text-sm leading-relaxed">
        <p>
          We want you to be completely satisfied with your Honeylooms purchase. If for any reason
          you are not happy with your items, we accept returns of unworn, unwashed, and undamaged
          items with their original tags attached.
        </p>
        <p>Please note that we only provide returns under the following conditions:</p>
        <ol className="list-decimal list-outside pl-6 space-y-4">
          <li>
            <b>Size:</b> Any issue in the size to be raised within 48 hours of receipt of item. The
            item can only be exchanged in this case and customer will have to bear the return
            courier charges. In case of non-availability of required size, the item would be
            eligible for a cash refund after deducting the applicable return courier charges.
          </li>
          <li>
            <b>Manufacturing Defect:</b> Any manufacturing issue to be raised within 48 hours of
            receipt of item. The item would be eligible for a cash refund after inspection in this
            case.
          </li>
        </ol>
        <p>
          To initiate a return, please contact our support team or use our online returns portal.
          Return shipping costs are the responsibility of the customer unless the item received was
          damaged, defective, or incorrect. Once we receive and inspect your returned items, your
          refund will be processed back to your original payment method within 5–7 business days.
        </p>
        <p>
          Please note that final sale items, custom orders, and gift cards are not eligible for
          return or exchange.
        </p>
      </div>
      <h1 className="text-3xl mt-10 font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
        Refund Policy
      </h1>
      <div className="text-neutral-600 dark:text-neutral-400 space-y-4 text-sm leading-relaxed">
        <p>
          We will notify you once we’ve received and inspected your return, and let you know if the
          refund was approved or not. If approved, you’ll be automatically refunded on your original
          payment method within 15 business days. Please remember it can take some time for your
          bank or credit card company to process and post the refund too.
        </p>
        <p>
          If more than 15 business days have passed since we’ve approved your return, please contact
          us at contact@titritfashion.com
        </p>
      </div>
      <h1 className="text-3xl mt-10 font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
        Shipping Policy
      </h1>
      <div className="text-neutral-600 dark:text-neutral-400 space-y-4 text-sm leading-relaxed">
        <h3 className="font-bold">Shipping Rates:</h3>
        <p>
          Free shipping on all prepaid orders all over India. For Cash On Delivery (COD) or
          International orders, additional shipping charges may be applied.
        </p>
        <h3 className="font-bold">Order Processing:</h3>
        <p>
          We strive to fulfill orders as soon as you place them. In most cases, your order will be
          sent to our delivery partner within 1-2 business days. Our business days are
          Monday-Saturday.
        </p>
        <h3 className="font-bold">Shipping Time:</h3>
        <p>
          Shipments are dispatched within 48 working hours of orders placed in normal circumstances.
          However, in case of pre-booked orders or orders that require finishing prior to dispatch
          may take longer. For further assistance you can email contact@titritfashion.coms
        </p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Learn about our deliveries, returns, and refund policy.',
  openGraph: mergeOpenGraph({
    title: 'Deliveries & Returns',
    url: '/deliveries-and-returns',
  }),
  title: 'Deliveries & Returns',
}
