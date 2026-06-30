'use client'

import { getCosmeticCurrency } from '@/utilities/cosmeticCurrency'
import { FieldDescription, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { Currency } from '@payloadcms/plugin-ecommerce/types'
import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const baseClass = 'formattedPrice'
const fallbackCurrency: Currency = {
  code: 'USD',
  decimals: 2,
  label: 'US Dollar',
  symbol: '$',
}

const convertToBaseValue = ({ currency, displayValue }: { currency: Currency; displayValue: string }) => {
  const cleanValue = displayValue.replace(currency.symbol, '').replace(/[^0-9.]/g, '')
  const floatValue = parseFloat(cleanValue || '0')

  return Math.round(floatValue * Math.pow(10, currency.decimals))
}

const convertFromBaseValue = ({ baseValue, currency }: { baseValue: number; currency: Currency }) =>
  (baseValue / Math.pow(10, currency.decimals)).toFixed(currency.decimals)

export const CosmeticPriceInput = (args: any) => {
  const clientField = args?.clientField
  const field = args?.field ?? {}
  const i18n = args?.i18n
  const path = args?.path ?? field?.name ?? 'amount'
  const readOnly = Boolean(args?.readOnly)
  const rawLabel = clientField?.label ?? field?.label
  const label =
    typeof rawLabel === 'function' && i18n?.t ? rawLabel({ i18n, t: i18n.t }) : rawLabel

  const {
    currenciesConfig,
    currency: currencyFromProps,
  } = args ?? {}
  const { setValue, value } = useField({ path })
  const numericValue = typeof value === 'number' ? value : null
  const [displayValue, setDisplayValue] = useState('')
  const isFirstRender = useRef(true)
  const debounceTimer = useRef<null | ReturnType<typeof setTimeout>>(null)
  const parentPath = path.split('.').slice(0, -1).join('.')
  const currencyPath = parentPath ? `${parentPath}.currency` : 'currency'
  const currencyFromSelectField = useFormFields(([fields]) => fields[currencyPath])
  const currencyCode = currencyFromProps?.code ?? currencyFromSelectField?.value

  const supportedCurrencies = useMemo(
    () =>
      (currenciesConfig?.supportedCurrencies as Currency[] | undefined)?.map(getCosmeticCurrency) || [
        getCosmeticCurrency(fallbackCurrency),
      ],
    [currenciesConfig?.supportedCurrencies],
  )

  const currency = useMemo(() => {
    if (currencyCode) {
      return supportedCurrencies.find((supportedCurrency) => supportedCurrency.code === currencyCode)
    }

    return supportedCurrencies[0] ?? getCosmeticCurrency(fallbackCurrency)
  }, [currencyCode, supportedCurrencies])
  const resolvedCurrency = currency ?? getCosmeticCurrency(fallbackCurrency)

  const description =
    typeof field.admin?.description === 'function'
      ? field.admin.description({ i18n, t: i18n?.t })
      : field.admin?.description

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      if (numericValue === null) {
        setDisplayValue('')
      } else {
        setDisplayValue(
          convertFromBaseValue({ baseValue: numericValue, currency: resolvedCurrency }),
        )
      }
    }
  }, [numericValue, resolvedCurrency])

  const updateValue = useCallback(
    (inputValue: string) => {
      if (inputValue === '') {
        setValue(null)
        return
      }

      setValue(convertToBaseValue({ currency: resolvedCurrency, displayValue: inputValue }))
    },
    [resolvedCurrency, setValue],
  )

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value

      if (!/^\d*(?:\.\d*)?$/.test(inputValue) && inputValue !== '') {
        return
      }

      setDisplayValue(inputValue)

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        updateValue(inputValue)
      }, 500)
    },
    [updateValue],
  )

  const handleInputBlur = useCallback(() => {
    if (displayValue === '') {
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }

    const baseValue = convertToBaseValue({
      currency: resolvedCurrency,
      displayValue,
    })
    const formattedValue = convertFromBaseValue({
      baseValue,
      currency: resolvedCurrency,
    })

    if (value !== baseValue) {
      setValue(baseValue)
    }

    setDisplayValue(formattedValue)
  }, [displayValue, resolvedCurrency, setValue, value])

  return (
    <div className={`field-type number ${baseClass}`}>
      {label && <FieldLabel as="label" htmlFor={path} label={label} required={field.required} />}
      <div className={`${baseClass}Container`}>
        <div className={`${baseClass}CurrencySymbol`}>
          <span>{resolvedCurrency.symbol}</span>
        </div>
        <input
          className={`${baseClass}Input`}
          disabled={readOnly}
          id={path}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          placeholder="0.00"
          type="text"
          value={displayValue}
        />
      </div>
      <FieldDescription
        className={`${baseClass}Description`}
        description={description}
        path={path}
      />
    </div>
  )
}
