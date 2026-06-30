import { replaceCurrencyText } from '@/utilities/cosmeticCurrency'
import type { Field } from 'payload'

const adminPriceCellPath = '@/components/admin/currency/CosmeticPriceCell#CosmeticPriceCell'
const adminPriceFieldPath = '@/components/admin/currency/CosmeticPriceInput#CosmeticPriceInput'

const overridePriceComponents = (field: Record<string, any>) => {
  const admin = field.admin ?? {}
  const components = admin.components ?? {}

  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...components,
        Cell: components.Cell
          ? {
              ...components.Cell,
              path: adminPriceCellPath,
            }
          : components.Cell,
        Field: components.Field
          ? {
              ...components.Field,
              path: adminPriceFieldPath,
            }
          : components.Field,
      },
    },
  }
}

const mapField = (field: Record<string, any>): Record<string, any> => {
  let nextField = { ...field }

  if (Array.isArray(nextField.fields)) {
    nextField.fields = nextField.fields.map(mapField)
  }

  if (Array.isArray(nextField.tabs)) {
    nextField.tabs = nextField.tabs.map((tab: Record<string, any>) => ({
      ...tab,
      ...(Array.isArray(tab.fields) ? { fields: tab.fields.map(mapField) } : {}),
    }))
  }

  if (Array.isArray(nextField.blocks)) {
    nextField.blocks = nextField.blocks.map((block: Record<string, any>) => ({
      ...block,
      ...(Array.isArray(block.fields) ? { fields: block.fields.map(mapField) } : {}),
    }))
  }

  if (nextField.name === 'currency' && Array.isArray(nextField.options)) {
    nextField.options = nextField.options.map((option: Record<string, any>) => {
      if (option?.value === 'USD') {
        return {
          ...option,
          label: 'Indian Rupee (INR)',
        }
      }

      return option
    })
  }

  if (nextField.name === 'priceInUSDEnabled') {
    nextField.label = 'Enable INR price'
  }

  if (nextField.name === 'priceInUSD') {
    nextField = overridePriceComponents(nextField)
    nextField.label = 'Price in INR'
  }

  if (nextField.name === 'amount') {
    nextField = overridePriceComponents(nextField)
  }

  if (typeof nextField.label === 'string') {
    nextField.label = replaceCurrencyText(nextField.label)
  }

  if (nextField.admin?.description && typeof nextField.admin.description === 'string') {
    nextField.admin = {
      ...nextField.admin,
      description: replaceCurrencyText(nextField.admin.description),
    }
  }

  return nextField
}

export const applyCosmeticCurrencyAdminOverrides = (fields: Field[] = []) =>
  fields.map((field) => mapField(field as Record<string, any>) as Field)
