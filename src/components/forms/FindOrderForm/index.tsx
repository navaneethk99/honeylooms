'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrderStatus } from '@/components/OrderStatus'
import { useAuth } from '@/providers/Auth'
import { formatDateTime } from '@/utilities/formatDateTime'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { findOrderStatus, type OrderStatusResult } from './findOrderStatus'

type FormData = {
  email: string
  orderID: string
}

type Props = {
  initialEmail?: string
}

export const FindOrderForm: React.FC<Props> = ({ initialEmail }) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<
    Extract<OrderStatusResult, { success: true }>['order'] | null
  >(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {
      email: initialEmail || user?.email,
    },
  })

  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setResult(null)

    try {
      const lookupResult = await findOrderStatus({
        email: data.email,
        orderID: data.orderID,
      })

      if (lookupResult.success) {
        setResult(lookupResult.order)
      } else {
        setSubmitError(lookupResult.error)
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return (
    <div className="border border-[#24231f]/15 p-6 sm:p-10">
      <h1 className="font-dream-orphanage text-4xl tracking-[-0.03em] text-[#24231f] sm:text-5xl">
        Track your order
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#6c675d]">
        Enter the order ID and email address used at checkout.
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="orderID" className="text-sm text-[#5d594f]">
            Order ID
          </Label>
          <Input
            autoComplete="off"
            className="h-11 rounded-none border-[#24231f]/25 bg-white px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
            id="orderID"
            inputMode="numeric"
            maxLength={8}
            placeholder="8-digit order ID"
            {...register('orderID', {
              required: 'Order ID is required.',
              pattern: { value: /^\d{8}$/, message: 'Enter the 8-digit order ID.' },
            })}
            type="text"
          />
          {errors.orderID && <FormError message={errors.orderID.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="email" className="text-sm text-[#5d594f]">
            Email address
          </Label>
          <Input
            autoComplete="email"
            className="h-11 rounded-none border-[#24231f]/25 bg-white px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
            id="email"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required.' })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
        {submitError && <FormError className="text-[#8a4b3c]" message={submitError} />}
        <Button
          type="submit"
          className="h-11 rounded-none bg-[#24231f] text-white shadow-none hover:bg-[#3b3933]"
          variant="default"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Checking…' : 'Check status'}
        </Button>
      </form>

      {result ? (
        <section aria-live="polite" className="mt-8 border-t border-[#24231f]/15 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#8c877d]">Order {result.orderCode}</p>
              <p className="mt-1 text-sm text-[#6c675d]">
                {formatDateTime({ date: result.createdAt, format: 'MMMM dd, yyyy' })}
              </p>
            </div>
            <OrderStatus className="text-sm" status={result.status} />
          </div>
          {result.status === 'shipped' && result.shippingLink ? (
            <a
              className="mt-5 inline-block text-sm text-[#8a682f] underline underline-offset-4"
              href={result.shippingLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              Track shipment
            </a>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
