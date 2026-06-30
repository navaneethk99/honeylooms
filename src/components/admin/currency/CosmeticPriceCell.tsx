'use client'

import { formatCosmeticPrice, getCosmeticCurrency } from '@/utilities/cosmeticCurrency'
import { useTranslation } from '@payloadcms/ui'

export const CosmeticPriceCell = (args: any) => {
  const { i18n, t } = useTranslation()
  const translate = t as (key: string) => string
  const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args
  const currency = getCosmeticCurrency(
    currencyFromProps || currenciesConfig?.supportedCurrencies?.[0],
  )

  if (!currency) {
    return <span>{translate('plugin-ecommerce:currencyNotSet')}</span>
  }

  if ((cellData == null || typeof cellData !== 'number') && rowData?.enableVariants) {
    return <span>{translate('plugin-ecommerce:priceSetInVariants')}</span>
  }

  if (cellData == null) {
    return <span>{translate('plugin-ecommerce:priceNotSet')}</span>
  }

  return <span>{formatCosmeticPrice({ baseValue: cellData, currency, locale: i18n.language })}</span>
}
