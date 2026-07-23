'use client'

import { AddressItem } from '@/components/addresses/AddressItem'
import { AddressForm } from '@/components/forms/AddressForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Address } from '@/payload-types'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useState } from 'react'

type Props = {
  setAddress: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
  heading?: string
  description?: string
  disabled?: boolean
  idPrefix: string
  onShowNewAddressForm?: () => void
  showNewAddressForm?: boolean
  skipSubmission?: boolean
}

type AddressSelectionModalProps = Pick<Props, 'disabled' | 'setAddress'> & {
  onUseNewAddress?: () => void
  triggerLabel?: string
}

export const CheckoutAddresses: React.FC<Props> = ({
  setAddress,
  disabled,
  idPrefix,
  onShowNewAddressForm,
  showNewAddressForm = false,
  skipSubmission,
  heading = 'Addresses',
  description = 'Enter a new address below.',
}) => {
  const { addresses } = useAddresses()
  const defaultAddress = showNewAddressForm ? undefined : addresses?.[0]

  useEffect(() => {
    if (defaultAddress) {
      setAddress((currentAddress) => currentAddress || defaultAddress)
    }
  }, [defaultAddress, setAddress])

  if (!addresses) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-medium mb-2">{heading}</h3>
        <p className="text-muted-foreground">
          {defaultAddress ? 'Your saved address is selected.' : description}
        </p>
      </div>
      {defaultAddress ? (
        <>
          <div className="border-y border-[#24231f]/20 py-5">
            <AddressItem address={defaultAddress} hideActions />
          </div>
          <AddressSelectionModal
            disabled={disabled}
            onUseNewAddress={() => {
              onShowNewAddressForm?.()
              setAddress(undefined)
            }}
            setAddress={setAddress}
            triggerLabel="Select different address"
          />
        </>
      ) : (
        <>
          {addresses.length > 0 ? (
            <AddressSelectionModal
              disabled={disabled}
              setAddress={setAddress}
              triggerLabel="Select different address"
            />
          ) : null}
          <AddressForm
            callback={setAddress}
            disabled={disabled}
            idPrefix={idPrefix}
            skipSubmission={skipSubmission}
            submitLabel="Use this address"
          />
        </>
      )}
    </div>
  )
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  setAddress,
  disabled,
  onUseNewAddress,
  triggerLabel = 'Select different address',
}) => {
  const [open, setOpen] = useState(false)
  const handleOpenChange = (state: boolean) => {
    setOpen(state)
  }

  const closeModal = () => {
    setOpen(false)
  }
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return <p>No addresses found. Please add an address.</p>
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="h-11 w-fit rounded-none border-[#24231f]/30 bg-transparent px-5 font-normal text-[#24231f] shadow-none hover:bg-[#24231f] hover:text-[#f5f1e8]"
          disabled={disabled}
          variant="outline"
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] touch-pan-y overscroll-contain rounded-none border-[#24231f]/20 bg-[#f5f1e8] p-0 text-[#24231f] shadow-none sm:max-w-xl"
        data-lenis-prevent
      >
        <DialogHeader className="border-b border-[#24231f]/20 px-6 py-6 pr-14">
          <DialogTitle className="font-editorial text-3xl font-normal tracking-[-0.03em]">
            Select an address
          </DialogTitle>
        </DialogHeader>

        <ul className="px-6">
          {addresses.map((address) => (
            <li key={address.id} className="border-b border-[#24231f]/20 py-5 last:border-none">
              <AddressItem
                address={address}
                beforeActions={
                  <Button
                    className="h-9 rounded-none bg-[#24231f] px-4 text-xs font-normal uppercase tracking-[0.12em] text-[#f5f1e8] shadow-none hover:bg-[#3b3933]"
                    onClick={(e) => {
                      e.preventDefault()
                      setAddress(address)
                      closeModal()
                    }}
                  >
                    Use address
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
        {onUseNewAddress ? (
          <div className="border-t border-[#24231f]/20 px-6 py-5">
            <Button
              className="h-auto rounded-none border-0 bg-transparent p-0 text-sm font-normal text-[#24231f] underline underline-offset-4 shadow-none hover:bg-transparent"
              variant="link"
              onClick={() => {
                onUseNewAddress()
                closeModal()
              }}
            >
              Enter a new address
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
