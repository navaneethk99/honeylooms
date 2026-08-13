import type { Address } from '@/payload-types'

export type AddressInput = Omit<Partial<Address>, 'createdAt' | 'customer' | 'id' | 'updatedAt'>

export const sanitizeAddressInput = (input: Record<string, unknown>): AddressInput => {
  const address = { ...input }

  delete address.createdAt
  delete address.customer
  delete address.id
  delete address.updatedAt

  return address as AddressInput
}

export const addressBelongsToUser = (address: Address, userID: number | string) => {
  const customerID = typeof address.customer === 'object' ? address.customer?.id : address.customer

  return String(customerID) === String(userID)
}
