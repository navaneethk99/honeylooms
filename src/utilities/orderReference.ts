type OrderReferenceSource = {
  id: number | string
  orderCode?: string | null
}

export const formatOrderReference = ({ id, orderCode }: OrderReferenceSource): string =>
  orderCode || String(id).padStart(8, '0')

export const parseOrderReference = (reference: string): string => reference.trim()
