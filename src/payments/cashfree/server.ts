import type { GroupField } from 'payload'
import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'

import type { Order, Transaction } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

type CashfreeEnvironment = 'production' | 'sandbox'

type CashfreeAdapterArgs = PaymentAdapterArgs & {
  apiVersion?: string
  appID: string
  environment?: CashfreeEnvironment
  paymentMethods?: string
  secretKey: string
}

type CashfreeAddress = {
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  company?: string | null
  country?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  postalCode?: string | null
  state?: string | null
  title?: string | null
}

type CashfreeOrderResponse = {
  cf_order_id?: string
  order_id?: string
  order_status?: string
  payment_session_id?: string
}

const DEFAULT_API_VERSION = '2025-01-01'
const DEFAULT_ENVIRONMENT: CashfreeEnvironment = 'sandbox'

const getBaseURL = (environment: CashfreeEnvironment) => {
  return environment === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}

const getHeaders = ({
  apiVersion,
  appID,
  secretKey,
}: {
  apiVersion: string
  appID: string
  secretKey: string
}) => {
  return {
    'Content-Type': 'application/json',
    'x-api-version': apiVersion,
    'x-client-id': appID,
    'x-client-secret': secretKey,
  }
}

const amountToDecimal = (amount: number) => {
  return Number((amount / 100).toFixed(2))
}

const stringifyAddress = (address?: CashfreeAddress) => {
  return JSON.stringify(address || {})
}

const parseAddress = (value?: string | null) => {
  if (!value) return undefined

  try {
    return JSON.parse(value) as CashfreeAddress
  } catch {
    return undefined
  }
}

const buildCustomerName = (address?: CashfreeAddress) => {
  const fullName = [address?.firstName, address?.lastName].filter(Boolean).join(' ').trim()

  return fullName || 'Customer'
}

const normalizePhone = (...values: Array<string | null | undefined>) => {
  const phone = values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim()

  return phone || '9999999999'
}

const normalizeAddress = (address: CashfreeAddress | undefined, fallbackPhone: string) => {
  if (!address) return undefined

  return {
    ...address,
    phone: normalizePhone(address.phone, fallbackPhone),
  }
}

export const cashfreeAdapter = (props: CashfreeAdapterArgs): PaymentAdapter => {
  const {
    apiVersion = DEFAULT_API_VERSION,
    appID,
    environment = DEFAULT_ENVIRONMENT,
    groupOverrides,
    label = 'Cashfree',
    paymentMethods = 'upi',
    secretKey,
  } = props

  const groupField: GroupField = {
    name: 'cashfree',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => data?.paymentMethod === 'cashfree',
      ...groupOverrides?.admin,
    },
    fields: groupOverrides?.fields?.({
      defaultFields: [
        {
          name: 'cfOrderID',
          type: 'text',
          label: 'Cashfree CF Order ID',
        },
        {
          name: 'orderID',
          type: 'text',
          label: 'Cashfree Order ID',
        },
        {
          name: 'paymentSessionID',
          type: 'text',
          label: 'Cashfree Payment Session ID',
        },
        {
          name: 'shippingAddressJSON',
          type: 'textarea',
          label: 'Cashfree Shipping Address JSON',
        },
      ],
    }) || [
      {
        name: 'cfOrderID',
        type: 'text',
        label: 'Cashfree CF Order ID',
      },
      {
        name: 'orderID',
        type: 'text',
        label: 'Cashfree Order ID',
      },
      {
        name: 'paymentSessionID',
        type: 'text',
        label: 'Cashfree Payment Session ID',
      },
      {
        name: 'shippingAddressJSON',
        type: 'textarea',
        label: 'Cashfree Shipping Address JSON',
      },
    ],
  }

  return {
    name: 'cashfree',
    label,
    group: groupField,
    initiatePayment: async ({ data, req }) => {
      const payload = req.payload
      const amount = data.cart?.subtotal
      const billingAddress = data.billingAddress as CashfreeAddress | undefined
      const cart = data.cart
      const customerEmail = data.customerEmail
      const shippingAddress = data.shippingAddress as CashfreeAddress | undefined
      const currency = data.cart?.currency === 'USD' ? 'USD' : 'USD'

      if (!cart || !cart.items?.length) {
        throw new Error('Cart is empty or not provided.')
      }

      if (!customerEmail || typeof customerEmail !== 'string') {
        throw new Error('A valid customer email is required to make a purchase.')
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('A valid amount is required to initiate a payment.')
      }

      const orderID = `order_${cart.id}_${crypto.randomUUID().replace(/-/g, '')}`
      const returnURL = new URL('/checkout/confirm-order', getServerSideURL())
      const customerPhone = normalizePhone(billingAddress?.phone, shippingAddress?.phone)
      const normalizedBillingAddress = normalizeAddress(billingAddress, customerPhone)
      const normalizedShippingAddress = normalizeAddress(shippingAddress, customerPhone)

      returnURL.searchParams.set('order_id', orderID)
      if (customerEmail) {
        returnURL.searchParams.set('email', customerEmail)
      }

      try {
        const response = await fetch(`${getBaseURL(environment)}/orders`, {
          body: JSON.stringify({
            customer_details: {
              customer_email: customerEmail,
              customer_id: req.user?.id ? String(req.user.id) : orderID,
              customer_name: buildCustomerName(normalizedBillingAddress),
              customer_phone: customerPhone,
            },
            order_amount: amountToDecimal(amount),
            order_currency: 'INR',
            order_id: orderID,
            order_meta: {
              payment_methods: paymentMethods,
              return_url: returnURL.toString(),
            },
          }),
          headers: getHeaders({ apiVersion, appID, secretKey }),
          method: 'POST',
        })

        const responseText = await response.text()
        let result: (CashfreeOrderResponse & { message?: string }) | null = null

        if (responseText) {
          try {
            result = JSON.parse(responseText) as CashfreeOrderResponse & {
              message?: string
            }
          } catch {
            result = null
          }
        }

        if (!response.ok || !result?.payment_session_id || !result.order_id) {
          const errorMessage =
            result?.message ||
            `Failed to create Cashfree order.${responseText ? ` ${responseText}` : ''}`

          throw new Error(errorMessage)
        }

        const flattenedCart = cart.items.map((item) => {
          const productID = typeof item.product === 'object' ? item.product.id : item.product
          const variantID =
            item.variant && typeof item.variant === 'object' ? item.variant.id : item.variant
          const { id: _id, product: _product, variant: _variant, ...customProperties } = item

          return {
            ...customProperties,
            product: productID,
            quantity: item.quantity,
            ...(variantID ? { variant: variantID } : {}),
          }
        })

        await payload.create({
          collection: 'transactions',
          data: {
            ...(req.user ? { customer: req.user.id } : { customerEmail }),
            amount,
            billingAddress: normalizedBillingAddress,
            cart: cart.id,
            cashfree: {
              cfOrderID: result.cf_order_id || null,
              orderID: result.order_id,
              paymentSessionID: result.payment_session_id,
              shippingAddressJSON: stringifyAddress(normalizedShippingAddress),
            },
            currency,
            items: flattenedCart,
            paymentMethod: 'cashfree',
            status: 'pending',
          },
          req,
        })

        return {
          message: 'Payment initiated successfully',
          orderID: result.order_id,
          paymentSessionID: result.payment_session_id,
        }
      } catch (error) {
        payload.logger.error({
          amount,
          cartID: cart?.id,
          customerEmail,
          err: error,
          msg: 'Error initiating payment with Cashfree',
        })
        throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
      }
    },
    confirmOrder: async ({ data, req }) => {
      const payload = req.payload
      const customerEmail = data.customerEmail
      const orderID = data.orderID

      if (!orderID || typeof orderID !== 'string') {
        throw new Error('Order ID is required.')
      }

      try {
        const transactionsResults = await payload.find({
          collection: 'transactions',
          req,
          where: {
            'cashfree.orderID': {
              equals: orderID,
            },
          },
        })

        const transaction = transactionsResults.docs[0] as Transaction | undefined

        if (!transactionsResults.totalDocs || !transaction) {
          throw new Error('No transaction found for the provided Cashfree order ID.')
        }

        if (transaction.order) {
          const existingOrderID =
            typeof transaction.order === 'object' ? transaction.order.id : transaction.order

          const existingOrder = (await payload.findByID({
            collection: 'orders',
            id: existingOrderID,
            req,
          })) as Order

          return {
            accessToken: existingOrder?.accessToken,
            message: 'Order already confirmed successfully',
            orderID: existingOrderID,
            transactionID: transaction.id,
          }
        }

        const response = await fetch(`${getBaseURL(environment)}/orders/${orderID}`, {
          headers: getHeaders({ apiVersion, appID, secretKey }),
          method: 'GET',
        })

        const result = (await response.json()) as CashfreeOrderResponse & {
          message?: string
        }

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch Cashfree order.')
        }

        if (result.order_status !== 'PAID') {
          throw new Error('Payment not completed.')
        }

        const shippingAddress = parseAddress(transaction.cashfree?.shippingAddressJSON)

        const order = (await payload.create({
          collection: 'orders',
          data: {
            ...(req.user ? { customer: req.user.id } : { customerEmail }),
            amount: transaction.amount,
            currency: transaction.currency,
            items: transaction.items,
            shippingAddress,
            status: 'processing',
            transactions: [transaction.id],
          },
          req,
        })) as Order

        if (transaction.cart) {
          const cartID =
            typeof transaction.cart === 'object' ? transaction.cart.id : transaction.cart

          await payload.update({
            id: cartID,
            collection: 'carts',
            data: {
              purchasedAt: new Date().toISOString(),
            },
            req,
          })
        }

        await payload.update({
          id: transaction.id,
          collection: 'transactions',
          data: {
            order: order.id,
            status: 'succeeded',
          },
          req,
        })

        return {
          ...(order.accessToken ? { accessToken: order.accessToken } : {}),
          message: 'Payment confirmed successfully',
          orderID: order.id,
          transactionID: transaction.id,
        }
      } catch (error) {
        payload.logger.error({
          err: error,
          msg: 'Error confirming order with Cashfree',
        })
        throw new Error(error instanceof Error ? error.message : 'Unknown error confirming payment')
      }
    },
  }
}
