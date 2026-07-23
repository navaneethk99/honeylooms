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
import { useState } from 'react'

type Props = {
  setAddress: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
  heading?: string
  description?: string
  disabled?: boolean
  idPrefix: string
  skipSubmission?: boolean
}

export const CheckoutAddresses: React.FC<Props> = ({
  setAddress,
  disabled,
  idPrefix,
  skipSubmission,
  heading = 'Addresses',
  description = 'Enter a new address below.',
}) => {
  const { addresses } = useAddresses()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-medium mb-2">{heading}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {addresses && addresses.length > 0 ? <AddressesModal setAddress={setAddress} /> : null}
      <AddressForm
        callback={setAddress}
        disabled={disabled}
        idPrefix={idPrefix}
        skipSubmission={skipSubmission}
        submitLabel="Use this address"
      />
    </div>
  )
}

const AddressesModal: React.FC<Pick<Props, 'setAddress'>> = ({ setAddress }) => {
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
        <Button variant="outline">Use existing address</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Use existing address</DialogTitle>
        </DialogHeader>

        <ul className="flex flex-col gap-8">
          {addresses.map((address) => (
            <li key={address.id} className="border-b pb-8 last:border-none">
              <AddressItem
                address={address}
                beforeActions={
                  <Button
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
      </DialogContent>
    </Dialog>
  )
}
