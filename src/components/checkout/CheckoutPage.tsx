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

import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Address } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { LottieLoader } from '@/components/LottieLoader'

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
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const { initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cashfree' | 'cod'>('cashfree')

  const billingPhone = billingAddress?.phone?.trim()
  const shippingPhone = shippingAddress?.phone?.trim()

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
      setSelectedPaymentMethod('cashfree')
    }
  }, [])

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      const selectedShippingAddress = billingAddressSameAsShipping ? billingAddress : shippingAddress

      if (!billingAddress?.phone?.trim()) {
        const errorMessage = 'A phone number is required on the billing address.'

        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      if (!selectedShippingAddress?.phone?.trim()) {
        const errorMessage = 'A phone number is required on the shipping address.'

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
            router.push(`/orders/${paymentData.orderID}${queryString ? `?${queryString}` : ''}`)
            return
          }

          setPaymentData(paymentData)
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
      } finally {
        setIsInitiatingPayment(false)
      }
    },
    [billingAddress, billingAddressSameAsShipping, email, initiatePayment, shippingAddress, user, clearCart, router],
  )

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
    <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <h2 className="font-medium text-3xl">Contact</h2>
        {!user && (
          <div className=" bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
            <div className="prose dark:prose-invert">
              <Button asChild className="no-underline text-inherit" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <p className="mt-0">
                <span className="mx-2">or</span>
                <Link href="/create-account">create an account</Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="bg-accent dark:bg-card rounded-lg p-4 ">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                Not you?{' '}
                <Link className="underline" href="/logout">
                  Log out
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent dark:bg-black rounded-lg p-4 ">
            <div>
              <p className="mb-4">Enter your email to checkout as a guest.</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                }}
                variant="default"
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}

        <h2 className="font-medium text-3xl">Address</h2>

        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={'outline'}
                  disabled={Boolean(paymentData)}
                  onClick={(e) => {
                    e.preventDefault()
                    setBillingAddress(undefined)
                  }}
                >
                  Remove
                </Button>
              }
              address={billingAddress}
            />
            {!billingPhone && (
              <p className="mt-3 text-sm text-destructive">
                Add a phone number to this address to use UPI checkout.
              </p>
            )}
          </div>
        ) : user ? (
          <CheckoutAddresses heading="Billing address" setAddress={setBillingAddress} />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address)
            }}
            skipSubmission={true}
          />
        )}

        <div className="flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={Boolean(paymentData || (!user && (!email || Boolean(emailEditable))))}
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
                <AddressItem
                  actions={
                    <Button
                      variant={'outline'}
                      disabled={Boolean(paymentData)}
                      onClick={(e) => {
                        e.preventDefault()
                        setShippingAddress(undefined)
                      }}
                    >
                      Remove
                    </Button>
                  }
                  address={shippingAddress}
                />
                {!shippingPhone && (
                  <p className="mt-3 text-sm text-destructive">
                    Add a phone number to this address to use UPI checkout.
                  </p>
                )}
              </div>
            ) : user ? (
              <CheckoutAddresses
                heading="Shipping address"
                description="Please select a shipping address."
                setAddress={setShippingAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address)
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}

        {!paymentData && (
          <div className="flex flex-col gap-4 my-6">
            <h3 className="text-xl font-medium">Select Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* UPI Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col gap-1 ${
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
                className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col gap-1 ${
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
              className="self-start min-w-[200px] mt-4"
              disabled={!canGoToPayment || isInitiatingPayment}
              onClick={(e) => {
                e.preventDefault()
                void initiatePaymentIntent(selectedPaymentMethod)
              }}
            >
              {isInitiatingPayment ? (
                'Processing...'
              ) : selectedPaymentMethod === 'cod' ? (
                'Place Order (COD)'
              ) : (
                'Proceed to Pay'
              )}
            </Button>
          </div>
        )}

        {!paymentData?.['paymentSessionID'] && error && (
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

        <Suspense fallback={<React.Fragment />}>
          {paymentData &&
            Boolean(paymentData['paymentSessionID']) &&
            Boolean(paymentData['orderID']) && (
              <div className="pb-16">
                <h2 className="font-medium text-3xl">Payment</h2>
                {error && <p>{`Error: ${error}`}</p>}
                <div className="flex flex-col gap-8">
                  <CheckoutForm
                    billingAddress={billingAddress}
                    customerEmail={email}
                    orderID={paymentData['orderID'] as string}
                    paymentSessionID={paymentData['paymentSessionID'] as string}
                    setProcessingPayment={setProcessingPayment}
                  />
                  <Button
                    variant="ghost"
                    className="self-start"
                    onClick={() => setPaymentData(null)}
                  >
                    Cancel payment
                  </Button>
                </div>
              </div>
            )}
        </Suspense>
      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
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
              let price = product?.priceInUSD

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = variant?.priceInUSD

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
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {image && typeof image !== 'string' && (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
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

                    {typeof price === 'number' && <Price amount={price} />}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Subtotal</span>
              <Price amount={cart.subtotal || 0} />
            </div>
            {selectedPaymentMethod === 'cod' && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>COD Handling Charge</span>
                <Price amount={2500} />
              </div>
            )}
            <hr className="my-1" />
            <div className="flex justify-between items-center gap-2">
              <span className="uppercase font-medium">Total</span>
              <Price
                className="text-3xl font-medium"
                amount={(cart.subtotal || 0) + (selectedPaymentMethod === 'cod' ? 2500 : 0)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
