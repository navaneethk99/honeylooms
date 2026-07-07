'use client'

import React, { useState } from 'react'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { AddressItem } from '@/components/addresses/AddressItem'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { DefaultDocumentIDType } from 'payload'

const DeleteAddressButton: React.FC<{ addressID: DefaultDocumentIDType }> = ({ addressID }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/addresses/${addressID}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete address')
      }

      toast.success('Address deleted successfully.')
      window.location.reload()
    } catch (error) {
      toast.error('Could not delete address. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
      className="w-full"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}

export const AddressListing: React.FC = () => {
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return <p>No addresses found.</p>
  }

  return (
    <div>
      <ul className="flex flex-col gap-8">
        {addresses.map((address) => (
          <li key={address.id} className="border-b pb-8 last:border-none">
            <AddressItem
              address={address}
              afterActions={address.id ? <DeleteAddressButton addressID={address.id} /> : null}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
