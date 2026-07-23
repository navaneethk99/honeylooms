'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useState } from 'react'

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
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { AddressSelectionModal, CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { Address } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { LottieLoader } from '@/components/LottieLoader'
import {
  calculateCartSubtotalFromItems,
  getEffectiveProductPrice,
  getOriginalProductPrice,
  isProductOnSale,
} from '@/utilities/pricing'

const MOBILE_NUMBER_PATTERN = /^[0-9]{10}$/

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const [error, setError] = useState<null | string>(null)
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const { initiatePayment, confirmOrder } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [showNewBillingAddressForm, setShowNewBillingAddressForm] = useState(false)
  const [showNewShippingAddressForm, setShowNewShippingAddressForm] = useState(false)
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cashfree' | 'cod'>('cashfree')

  const [couponCode, setCouponCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    amount: number
    message: string
  } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const billingPhone = billingAddress?.phone?.trim()
  const shippingPhone = shippingAddress?.phone?.trim()

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const resolvedSubtotal = calculateCartSubtotalFromItems(
    cart?.items?.map((item) => ({
      product: typeof item.product === 'object' ? item.product : undefined,
      quantity: item.quantity,
      variant: typeof item.variant === 'object' ? item.variant : undefined,
    })),
  )
  const checkoutSubtotal = resolvedSubtotal || cart?.subtotal || 0
  const checkoutTotal =
    checkoutSubtotal - (appliedDiscount?.amount || 0) + (selectedPaymentMethod === 'cod' ? 2500 : 0)

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )
  const canEnterAddress = Boolean(user || (email && !emailEditable))

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setShowNewBillingAddressForm(false)
      setShowNewShippingAddressForm(false)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
      setSelectedPaymentMethod('cashfree')
    }
  }, [])

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      const selectedShippingAddress = billingAddressSameAsShipping
        ? billingAddress
        : shippingAddress

      const billingMobileNumber = billingAddress?.phone?.trim() || ''
      const shippingMobileNumber = selectedShippingAddress?.phone?.trim() || ''

      if (!MOBILE_NUMBER_PATTERN.test(billingMobileNumber)) {
        const errorMessage =
          'The billing mobile number must be exactly 10 digits using numbers from 0-9.'

        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      if (!MOBILE_NUMBER_PATTERN.test(shippingMobileNumber)) {
        const errorMessage =
          'The shipping mobile number must be exactly 10 digits using numbers from 0-9.'

        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      setIsInitiatingPayment(true)
      try {
        const paymentData = (await initiatePayment(paymentID, {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress,
            shippingAddress: selectedShippingAddress,
            ...(appliedDiscount ? { promoCode: appliedDiscount.code } : {}),
          },
        })) as Record<string, unknown>

        if (paymentData) {
          if (paymentID === 'cod') {
            const accessToken = (paymentData.accessToken as string) || ''
            const queryParams = new URLSearchParams()
            const customerEmail = email || user?.email
            if (customerEmail) {
              queryParams.set('email', customerEmail)
            }
            if (accessToken) {
              queryParams.set('accessToken', accessToken)
            }
            clearCart()
            const queryString = queryParams.toString()
            const publicOrderID = paymentData.orderCode || paymentData.orderID
            router.push(`/orders/${publicOrderID}${queryString ? `?${queryString}` : ''}`)
            return
          }

          if (paymentID === 'cashfree') {
            await loadCashfreeScript()

            if (!window.Cashfree) {
              throw new Error('Cashfree SDK is unavailable.')
            }

            const cashfree = window.Cashfree({
              mode:
                process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
            })

            const paymentSessionID = paymentData.paymentSessionID as string
            const orderID = paymentData.orderID as string

            await cashfree.checkout({
              paymentSessionId: paymentSessionID,
              redirectTarget: '_modal',
            })

            setProcessingPayment(true)
            setIsInitiatingPayment(false)

            const customerEmail = email || user?.email
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
              const publicOrderID =
                'orderCode' in confirmResult ? confirmResult.orderCode : confirmResult.orderID
              router.push(`/orders/${publicOrderID}${queryString ? `?${queryString}` : ''}`)
              return
            }

            throw new Error('Order confirmation did not return an order ID.')
          }
        }
      } catch (error) {
        let errorData: Record<string, any> = {}
        let errorMessage = 'An error occurred while initiating payment.'

        if (error instanceof Error) {
          try {
            errorData = JSON.parse(error.message) as Record<string, any>
          } catch {
            errorMessage = error.message
          }
        }

        if (errorData?.cause?.code === 'OutOfStock') {
          errorMessage = 'One or more items in your cart are out of stock.'
        }

        setError(errorMessage)
        toast.error(errorMessage)
        setProcessingPayment(false)
      } finally {
        setIsInitiatingPayment(false)
      }
    },
    [
      billingAddress,
      billingAddressSameAsShipping,
      email,
      initiatePayment,
      confirmOrder,
      shippingAddress,
      user,
      clearCart,
      router,
      appliedDiscount,
    ],
  )

  const handleApplyCoupon = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!couponCode.trim()) return
      setValidatingCoupon(true)
      setCouponError(null)
      try {
        const res = await fetch(
          `/api/promo-codes/validate?code=${encodeURIComponent(couponCode)}&subtotal=${checkoutSubtotal}`,
        )
        const data = await res.json()
        if (data.valid) {
          setAppliedDiscount({
            code: data.code,
            amount: data.discountAmount,
            message: data.message,
          })
          toast.success(data.message)
        } else {
          setCouponError(data.message || 'Invalid coupon code')
          toast.error(data.message || 'Invalid coupon code')
        }
      } catch (err) {
        setCouponError('Failed to validate coupon')
        toast.error('Failed to validate coupon')
      } finally {
        setValidatingCoupon(false)
      }
    },
    [checkoutSubtotal, couponCode],
  )

  const handleRemoveCoupon = useCallback(() => {
    setAppliedDiscount(null)
    setCouponCode('')
    setCouponError(null)
    toast.success('Coupon removed')
  }, [])

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-12 w-full items-center justify-center">
        <div className="prose dark:prose-invert text-center max-w-none self-center mb-8">
          <p>Processing your payment...</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-12 w-full items-center">
        <p>Your cart is empty.</p>
        <Link href="/search">Continue shopping?</Link>
      </div>
    )
  }

  return (
    <div className="my-8 flex grow flex-col items-stretch justify-stretch gap-10 md:flex-row md:gap-6 lg:gap-8">
      {(isInitiatingPayment || isProcessingPayment) && <LottieLoader size="full" />}
      <div className="flex basis-full flex-col justify-stretch gap-8 lg:basis-2/3">
        <h2 className="font-editorial text-4xl font-normal tracking-[-0.03em] text-[#24231f]">
          Contact
        </h2>
        {!user && (
          <div className="flex w-full items-center border-y border-[#24231f]/20 py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#6c675d]">
              <Button
                asChild
                className="h-10 rounded-none bg-[#24231f] px-5 text-[#f5f1e8] shadow-none hover:bg-[#3b3933]"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <p>
                <span className="mr-1">or</span>
                <Link
                  className="text-[#24231f] underline underline-offset-4"
                  href="/create-account"
                >
                  create an account
                </Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="border-y border-[#24231f]/20 py-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[#24231f]">{user.email}</p>
              <p className="text-[#6c675d]">
                Not you?{' '}
                <Link className="text-[#24231f] underline underline-offset-4" href="/logout">
                  Log out
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="border-b border-[#24231f]/20 pb-8">
            <div>
              <p className="mb-5 text-sm text-[#6c675d]">
                Enter your email to checkout as a guest.
              </p>

              <FormItem className="mb-5">
                <Label className="text-sm text-[#5d594f]" htmlFor="email">
                  Email address
                </Label>
                <Input
                  className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                className="h-11 rounded-none bg-[#24231f] px-6 text-sm text-[#f5f1e8] shadow-none hover:bg-[#3b3933]"
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                }}
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}

        {canEnterAddress ? (
          <>
            <h2 className="font-medium text-3xl">Address</h2>

            {billingAddress ? (
              <div>
                <AddressItem address={billingAddress} hideActions />
                {user && addresses?.length ? (
                  <div className="mt-4">
                    <AddressSelectionModal
                      disabled={isProcessingPayment || isInitiatingPayment}
                      onUseNewAddress={() => {
                        setShowNewBillingAddressForm(true)
                        setBillingAddress(undefined)
                      }}
                      setAddress={setBillingAddress}
                      triggerLabel="Select different address"
                    />
                  </div>
                ) : null}
                {!MOBILE_NUMBER_PATTERN.test(billingPhone || '') && (
                  <p className="mt-3 text-sm text-destructive">
                    Add a valid 10-digit mobile number using only digits from 0-9.
                  </p>
                )}
              </div>
            ) : (
              <CheckoutAddresses
                heading="Billing address"
                idPrefix="billing"
                onShowNewAddressForm={() => setShowNewBillingAddressForm(true)}
                setAddress={setBillingAddress}
                showNewAddressForm={showNewBillingAddressForm}
                skipSubmission={!user}
              />
            )}

            <div className="flex gap-4 items-center">
              <Checkbox
                id="shippingTheSameAsBilling"
                checked={billingAddressSameAsShipping}
                disabled={isProcessingPayment || isInitiatingPayment}
                onCheckedChange={(state) => {
                  setBillingAddressSameAsShipping(state as boolean)
                }}
              />
              <Label htmlFor="shippingTheSameAsBilling">Shipping is the same as billing</Label>
            </div>

            {!billingAddressSameAsShipping && (
              <>
                {shippingAddress ? (
                  <div>
                    <AddressItem address={shippingAddress} hideActions />
                    {user && addresses?.length ? (
                      <div className="mt-4">
                        <AddressSelectionModal
                          disabled={isProcessingPayment || isInitiatingPayment}
                          onUseNewAddress={() => {
                            setShowNewShippingAddressForm(true)
                            setShippingAddress(undefined)
                          }}
                          setAddress={setShippingAddress}
                          triggerLabel="Select different address"
                        />
                      </div>
                    ) : null}
                    {!MOBILE_NUMBER_PATTERN.test(shippingPhone || '') && (
                      <p className="mt-3 text-sm text-destructive">
                        Add a valid 10-digit mobile number using only digits from 0-9.
                      </p>
                    )}
                  </div>
                ) : (
                  <CheckoutAddresses
                    heading="Shipping address"
                    idPrefix="shipping"
                    onShowNewAddressForm={() => setShowNewShippingAddressForm(true)}
                    setAddress={setShippingAddress}
                    showNewAddressForm={showNewShippingAddressForm}
                    skipSubmission={!user}
                  />
                )}
              </>
            )}
          </>
        ) : null}

        <div className="flex flex-col gap-4 my-6">
          <h3 className="text-xl font-medium">Select Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* UPI Option */}
            <div
              className={`p-4 border cursor-pointer transition-all flex flex-col gap-1 ${
                selectedPaymentMethod === 'cashfree'
                  ? 'border-[#D9A321] bg-[#D9A321]/5 ring-1 ring-[#D9A321]'
                  : 'border-border hover:border-foreground/50'
              }`}
              onClick={() => setSelectedPaymentMethod('cashfree')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">Pay Using UPI</span>
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded">
                  Free
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Instant confirmation via UPI apps (GPay, PhonePe, Paytm, etc.)
              </p>
            </div>

            {/* COD Option */}
            <div
              className={`p-4 border cursor-pointer transition-all flex flex-col gap-1 ${
                selectedPaymentMethod === 'cod'
                  ? 'border-[#D9A321] bg-[#D9A321]/5 ring-1 ring-[#D9A321]'
                  : 'border-border hover:border-foreground/50'
              }`}
              onClick={() => setSelectedPaymentMethod('cod')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">Cash on Delivery</span>
                <span className="text-xs uppercase font-mono tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
                  + Rs. 25
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay with cash when your package is delivered.
              </p>
            </div>
          </div>

          <Button
            className="self-start min-w-[200px] mt-4 rounded-none h-12 bg-[#24231F]"
            disabled={!canGoToPayment || isInitiatingPayment || isProcessingPayment}
            onClick={(e) => {
              e.preventDefault()
              void initiatePaymentIntent(selectedPaymentMethod)
            }}
          >
            {isInitiatingPayment || isProcessingPayment
              ? 'Processing...'
              : selectedPaymentMethod === 'cod'
                ? 'Place Order (COD)'
                : 'Proceed to Pay'}
          </Button>
        </div>

        {error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
              }}
              variant="default"
            >
              Try again
            </Button>
          </div>
        )}
      </div>

      {!cartIsEmpty && (
        <div className="flex h-fit basis-full flex-col gap-8 border-none bg-primary/5 p-8 lg:basis-1/3 lg:pl-8">
          <h2 className="text-3xl font-medium">Your cart</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              const productOnSale = isProductOnSale(product)
              let price = getEffectiveProductPrice(product)
              let originalPrice = getOriginalProductPrice(product, variant)

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                if (!product.onSale && typeof variant?.priceInUSD === 'number') {
                  price = variant.priceInUSD
                }

                const imageVariant = product.gallery?.find((item: any) => {
                  if (!item.variantOption) return false
                  const variantOptionID =
                    typeof item.variantOption === 'object'
                      ? item.variantOption.id
                      : item.variantOption

                  const hasMatch = variant?.options?.some((option: any) => {
                    if (typeof option === 'object') return option.id === variantOptionID
                    else return option === variantOptionID
                  })

                  return hasMatch
                })

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="relative aspect-[1/1] w-20 shrink-0 overflow-hidden border border-[#24231f]/20 bg-[#ebe5da]">
                    {image && typeof image !== 'string' && (
                      <Media fill imgClassName="object-cover" resource={image} size="80px" />
                    )}
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {/*{productOnSale ? (
                        <span className="inline-flex w-fit items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Sale
                        </span>
                      ) : null}*/}
                      {variant && typeof variant === 'object' && (
                        <p className="text-sm font-mono text-primary/50 tracking-widest">
                          {variant.options
                            ?.map((option: any) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === 'number' && (
                      <div className="flex flex-col items-end">
                        <Price amount={price} />
                        {productOnSale ? (
                          <Price
                            amount={originalPrice}
                            className="text-xs text-muted-foreground line-through"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />
          <div className="flex flex-col gap-2 my-2">
            <label htmlFor="coupon" className="text-sm font-medium text-foreground">
              Have a discount coupon?
            </label>
            {appliedDiscount ? (
              <div className="flex items-center justify-between p-2 border border-dashed border-emerald-500 rounded bg-emerald-500/5">
                <div className="flex flex-col">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                    {appliedDiscount.code} applied
                  </span>
                  <span className="text-xs text-emerald-500">
                    Saved <Price amount={appliedDiscount.amount} as="span" />
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground hover:cursor-pointer"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="bg-[#F6F1E8] rounded-none h-12"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="h-12 hover:cursor-pointer bg-[#24231F] rounded-none"
                >
                  {validatingCoupon ? 'Applying...' : 'Apply'}
                </Button>
              </form>
            )}
            {couponError && <p className="text-xs text-destructive">{couponError}</p>}
          </div>
          <hr />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Subtotal</span>
              <Price amount={checkoutSubtotal} />
            </div>
            {appliedDiscount && (
              <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400">
                <span>Discount ({appliedDiscount.code})</span>
                <span className="flex items-center gap-1">
                  - <Price amount={appliedDiscount.amount} as="span" />
                </span>
              </div>
            )}
            {selectedPaymentMethod === 'cod' && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>COD Handling Charge</span>
                <Price amount={2500} />
              </div>
            )}
            <hr className="my-1" />
            <div className="flex justify-between items-center gap-2">
              <span className="uppercase font-medium">Total</span>
              <Price className="text-3xl font-medium" amount={checkoutTotal} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
