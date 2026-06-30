import type { Currency } from '@payloadcms/plugin-ecommerce/types'

const COSMETIC_CURRENCY_CODE = 'INR'
const COSMETIC_CURRENCY_LABEL = 'Indian Rupee'
const COSMETIC_CURRENCY_SYMBOL = '₹'

export const getCosmeticCurrencyCode = (code?: null | string) =>
  code === 'USD' ? COSMETIC_CURRENCY_CODE : code

export const getCosmeticCurrency = <T extends null | Currency | undefined>(currency: T): T => {
  if (!currency || currency.code !== 'USD') {
    return currency
  }

  return {
    ...currency,
    label: COSMETIC_CURRENCY_LABEL,
    symbol: COSMETIC_CURRENCY_SYMBOL,
  } as T
}

export const formatCosmeticPrice = ({
  baseValue,
  currency,
  locale = 'en',
}: {
  baseValue: number
  currency: Currency
  locale?: string
}) => {
  const currencyCode = getCosmeticCurrencyCode(currency.code) || currency.code

  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    currencyDisplay: currency.symbolDisplay ?? 'symbol',
    maximumFractionDigits: currency.decimals,
    minimumFractionDigits: currency.decimals,
    style: 'currency',
  }).format(baseValue / Math.pow(10, currency.decimals))
}

export const replaceCurrencyText = (value: string) =>
  value.replace(/\bUSD\b/g, COSMETIC_CURRENCY_CODE).replace(/\$/g, COSMETIC_CURRENCY_SYMBOL)

