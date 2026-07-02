import type {
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '@payloadcms/plugin-ecommerce/types'

export const codAdapterClient = (props?: PaymentAdapterClientArgs): PaymentAdapterClient => ({
  confirmOrder: true,
  initiatePayment: true,
  label: props?.label || 'Cash on Delivery',
  name: 'cod',
})
