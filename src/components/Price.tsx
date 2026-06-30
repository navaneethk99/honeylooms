'use client'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { formatCosmeticPrice, getCosmeticCurrency } from '@/utilities/cosmeticCurrency'
import React, { useMemo } from 'react'

type BaseProps = {
  className?: string
  currencyCodeClassName?: string
  as?: 'span' | 'p'
}

type PriceFixed = {
  amount: number
  currencyCode?: string
  highestAmount?: never
  lowestAmount?: never
}

type PriceRange = {
  amount?: never
  currencyCode?: string
  highestAmount: number
  lowestAmount: number
}

type Props = BaseProps & (PriceFixed | PriceRange)

export const Price = ({
  amount,
  className,
  highestAmount,
  lowestAmount,
  currencyCode: currencyCodeFromProps,
  as = 'p',
}: Props & React.ComponentProps<'p'>) => {
  const { currency, supportedCurrencies } = useCurrency()

  const Element = as

  const currencyToUse = useMemo(() => {
    if (currencyCodeFromProps) {
      return supportedCurrencies.find((currency) => currency.code === currencyCodeFromProps)
    }
    return currency
  }, [currency, currencyCodeFromProps, supportedCurrencies])

  const formatValue = (value: number) => {
    if (!currencyToUse) {
      return value.toString()
    }

    return formatCosmeticPrice({
      baseValue: value,
      currency: getCosmeticCurrency(currencyToUse),
    })
  }

  if (typeof amount === 'number') {
    return (
      <Element className={className} suppressHydrationWarning>
        {formatValue(amount)}
      </Element>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    return (
      <Element className={className} suppressHydrationWarning>
        {`${formatValue(lowestAmount)} - ${formatValue(highestAmount)}`}
      </Element>
    )
  }

  if (lowestAmount) {
    return (
      <Element className={className} suppressHydrationWarning>
        {formatValue(lowestAmount)}
      </Element>
    )
  }

  return null
}
