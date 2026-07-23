'use client'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { defaultCountries as supportedCountries } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Button } from '@/components/ui/button'
import { deepMergeSimple } from 'payload/shared'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'

type AddressFormValues = {
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
}

const MOBILE_NUMBER_PATTERN = /^[0-9]{10}$/

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'> & { country?: string }
  callback?: (data: Partial<Address>) => void
  disabled?: boolean
  idPrefix?: string
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
  submitLabel?: string
}

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  disabled = false,
  idPrefix = '',
  skipSubmission,
  submitLabel = 'Submit',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddressFormValues>({
    defaultValues: initialData,
  })

  const countryValue = watch('country')
  const isNotIndia = Boolean(
    countryValue && countryValue.toLowerCase() !== 'in' && countryValue.toLowerCase() !== 'india',
  )

  const { createAddress, updateAddress } = useAddresses()
  const fieldID = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name)

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const newData = deepMergeSimple(initialData || {}, data)

      if (!skipSubmission) {
        if (addressID) {
          await updateAddress(addressID, newData)
        } else {
          await createAddress(newData)
        }
      }

      if (callback) {
        callback(newData)
      }
    },
    [initialData, skipSubmission, callback, addressID, updateAddress, createAddress],
  )

  return (
    <form
      className="[&_input]:h-11 [&_input]:rounded-none [&_input]:border-[#24231f]/25 [&_input]:bg-transparent [&_input]:shadow-none [&_label]:font-sans [&_label]:text-sm [&_label]:text-[#5d594f] [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:rounded-none [&_[data-slot=select-trigger]]:border-[#24231f]/25 [&_[data-slot=select-trigger]]:shadow-none"
      onSubmit={handleSubmit(onSubmit)}
    >
      <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <FormItem className="flex-1">
              <Label htmlFor={fieldID('firstName')}>First name*</Label>
              <Input
                id={fieldID('firstName')}
                autoComplete="given-name"
                {...register('firstName', { required: 'First name is required.' })}
              />
              {errors.firstName && <FormError message={errors.firstName.message} />}
            </FormItem>

            <FormItem className="flex-1">
              <Label htmlFor={fieldID('lastName')}>Last name*</Label>
              <Input
                autoComplete="family-name"
                id={fieldID('lastName')}
                {...register('lastName', { required: 'Last name is required.' })}
              />
              {errors.lastName && <FormError message={errors.lastName.message} />}
            </FormItem>
          </div>

          <FormItem>
            <Label htmlFor={fieldID('phone')}>Phone*</Label>
            <Input
              type="tel"
              id={fieldID('phone')}
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              {...register('phone', {
                required: 'Phone is required for UPI payments.',
                pattern: {
                  value: MOBILE_NUMBER_PATTERN,
                  message: 'Phone must be exactly 10 digits using numbers from 0-9.',
                },
              })}
            />
            {errors.phone && <FormError message={errors.phone.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor={fieldID('addressLine1')}>Address line 1*</Label>
            <Input
              id={fieldID('addressLine1')}
              autoComplete="address-line1"
              {...register('addressLine1', { required: 'Address line 1 is required.' })}
            />
            {errors.addressLine1 && <FormError message={errors.addressLine1.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor={fieldID('addressLine2')}>Address line 2</Label>
            <Input
              id={fieldID('addressLine2')}
              autoComplete="address-line2"
              {...register('addressLine2')}
            />
            {errors.addressLine2 && <FormError message={errors.addressLine2.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor={fieldID('city')}>City*</Label>
            <Input
              id={fieldID('city')}
              autoComplete="address-level2"
              {...register('city', { required: 'City is required.' })}
            />
            {errors.city && <FormError message={errors.city.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor={fieldID('state')}>State</Label>
            <Input id={fieldID('state')} autoComplete="address-level1" {...register('state')} />
            {errors.state && <FormError message={errors.state.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor={fieldID('postalCode')}>Zip Code*</Label>
            <Input
              id={fieldID('postalCode')}
              {...register('postalCode', { required: 'Postal code is required.' })}
            />
            {errors.postalCode && <FormError message={errors.postalCode.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor={fieldID('country')}>Country*</Label>

            <Select
              {...register('country', {
                required: 'Country is required.',
              })}
              onValueChange={(value) => {
                setValue('country', value, { shouldValidate: true })
              }}
              disabled={disabled}
              required
              defaultValue={initialData?.country || ''}
            >
              <SelectTrigger id={fieldID('country')} className="w-full">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {supportedCountries.map((country) => {
                  const value = typeof country === 'string' ? country : country.value
                  const label =
                    typeof country === 'string'
                      ? country
                      : typeof country.label === 'string'
                        ? country.label
                        : value

                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {errors.country && <FormError message={errors.country.message} />}
            {isNotIndia && <FormError message="Sorry! We do not ship outside India yet" />}
          </FormItem>
        </div>

        <Button
          className="h-11 rounded-none bg-[#24231f] px-6 text-sm text-[#f5f1e8] shadow-none hover:bg-[#3b3933]"
          disabled={isNotIndia || disabled}
          type="submit"
        >
          {submitLabel}
        </Button>
      </fieldset>
    </form>
  )
}
