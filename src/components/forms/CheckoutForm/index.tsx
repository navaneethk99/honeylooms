'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React, { FormEvent, useCallback, useState } from 'react'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { Address } from '@/payload-types'

type Props = {
  customerEmail?: string
  billingAddress?: Partial<Address>
  orderID: string
  paymentSessionID: string
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>
}

type CashfreeInstance = {
  checkout: (options: {
    paymentSessionId: string
    redirectTarget?: '_blank' | '_modal' | '_self' | '_top'
  }) => Promise<unknown>
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'production' | 'sandbox' }) => CashfreeInstance
  }
}

let cashfreeScriptPromise: Promise<void> | null = null

const loadCashfreeScript = async () => {
  if (typeof window === 'undefined') return

  if (window.Cashfree) return

  if (!cashfreeScriptPromise) {
    cashfreeScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]',
      )

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true })
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load Cashfree SDK.')),
          {
            once: true,
          },
        )
        return
      }

      const script = document.createElement('script')

      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK.'))

      document.body.appendChild(script)
    })
  }

  await cashfreeScriptPromise
}

export const CheckoutForm: React.FC<Props> = ({
  customerEmail,
  orderID,
  paymentSessionID,
  setProcessingPayment,
}) => {
  const [error, setError] = useState<null | string>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { clearCart } = useCart()
  const { confirmOrder } = usePayments()

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)
      setIsLoading(true)
      setProcessingPayment(true)

      try {
        await loadCashfreeScript()

        if (!window.Cashfree) {
          throw new Error('Cashfree SDK is unavailable.')
        }

        const cashfree = window.Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        })

        await cashfree.checkout({
          paymentSessionId: paymentSessionID,
          redirectTarget: '_modal',
        })

        const confirmResult = await confirmOrder('cashfree', {
          additionalData: {
            ...(customerEmail ? { customerEmail } : {}),
            orderID,
          },
        })

        if (confirmResult && typeof confirmResult === 'object' && 'orderID' in confirmResult) {
          const accessToken =
            'accessToken' in confirmResult ? (confirmResult.accessToken as string) : ''
          const queryParams = new URLSearchParams()

          if (customerEmail) {
            queryParams.set('email', customerEmail)
          }

          if (accessToken) {
            queryParams.set('accessToken', accessToken)
          }

          clearCart()

          const queryString = queryParams.toString()
          router.push(`/orders/${confirmResult.orderID}${queryString ? `?${queryString}` : ''}`)
          return
        }

        throw new Error('Order confirmation did not return an order ID.')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        setError(`Error while submitting payment: ${msg}`)
        setIsLoading(false)
        setProcessingPayment(false)
      }
    },
    [
      clearCart,
      confirmOrder,
      customerEmail,
      orderID,
      paymentSessionID,
      router,
      setProcessingPayment,
    ],
  )

  return (
    <form onSubmit={handleSubmit}>
      {error && <Message error={error} />}
      <div className="rounded-lg border bg-primary/5 p-4 text-sm text-muted-foreground">
        Cashfree will open a secure UPI payment window and charge the order in Indian rupees.
      </div>
      <div className="mt-8 flex gap-4">
        <Button disabled={isLoading} type="submit" variant="default">
          {isLoading ? 'Loading...' : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}
