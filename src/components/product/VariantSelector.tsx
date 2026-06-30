'use client'

import { Button } from '@/components/ui/button'
import type { Product } from '@/payload-types'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.docs
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  if (!hasVariants) {
    return null
  }

  return variantTypes?.map((type) => {
    if (!type || typeof type !== 'object') {
      return <></>
    }

    const options = type.options?.docs

    if (!options || !Array.isArray(options) || !options.length) {
      return <></>
    }

    return (
      <dl className="flex flex-col gap-3" key={type.id}>
        <dt className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-mono font-bold">
          Select {type.label}
        </dt>
        <dd className="flex flex-wrap gap-2">
          <React.Fragment>
            {options?.map((option) => {
              if (!option || typeof option !== 'object') {
                return <></>
              }

              const optionID = option.id
              const optionKeyLowerCase = type.name

              // Base option params on current params so we can preserve any other param state in the url.
              const optionSearchParams = new URLSearchParams(searchParams.toString())

              // Remove image and variant ID from this search params so we can loop over it safely.
              optionSearchParams.delete('variant')
              optionSearchParams.delete('image')

              // Update the option params using the current option to reflect how the url *would* change,
              // if the option was clicked.
              optionSearchParams.set(optionKeyLowerCase, String(optionID))

              const currentOptions = Array.from(optionSearchParams.values())

              let isAvailableForSale = true

              // Find a matching variant
              if (variants) {
                const matchingVariant = variants
                  .filter((variant) => typeof variant === 'object')
                  .find((variant) => {
                    if (!variant.options || !Array.isArray(variant.options)) return false

                    // Check if all variant options match the current options in the URL
                    return variant.options.every((variantOption) => {
                      if (typeof variantOption !== 'object')
                        return currentOptions.includes(String(variantOption))

                      return currentOptions.includes(String(variantOption.id))
                    })
                  })

                if (matchingVariant) {
                  // If we found a matching variant, set the variant ID in the search params.
                  optionSearchParams.set('variant', String(matchingVariant.id))

                  if (matchingVariant.inventory && matchingVariant.inventory > 0) {
                    isAvailableForSale = true
                  } else {
                    isAvailableForSale = false
                  }
                }
              }

              const optionUrl = createUrl(pathname, optionSearchParams)

              // The option is active if it's in the url params.
              const isActive =
                Boolean(isAvailableForSale) &&
                searchParams.get(optionKeyLowerCase) === String(optionID)

              return (
                <button
                  aria-disabled={!isAvailableForSale}
                  className={clsx(
                    'px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border rounded-none min-w-[3.5rem] h-10 flex items-center justify-center',
                    isActive
                      ? 'bg-neutral-950 border-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-950'
                      : isAvailableForSale
                      ? 'bg-transparent border-neutral-200 hover:border-neutral-950 text-neutral-800 dark:border-neutral-800 dark:hover:border-neutral-50 dark:text-neutral-200 cursor-pointer'
                      : 'bg-transparent border-neutral-100 text-neutral-300 dark:border-neutral-900 dark:text-neutral-700 cursor-not-allowed line-through',
                  )}
                  disabled={!isAvailableForSale}
                  key={option.id}
                  onClick={() => {
                    if (isAvailableForSale) {
                      router.replace(`${optionUrl}`, {
                        scroll: false,
                      })
                    }
                  }}
                  title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                >
                  {option.label}
                </button>
              )
            })}
          </React.Fragment>
        </dd>
      </dl>
    )
  })
}
