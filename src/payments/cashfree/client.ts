import type {
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '@payloadcms/plugin-ecommerce/types'

export const cashfreeAdapterClient = (props?: PaymentAdapterClientArgs): PaymentAdapterClient => ({
  confirmOrder: true,
  initiatePayment: true,
  label: props?.label || 'UPI',
  name: 'cashfree',
})
