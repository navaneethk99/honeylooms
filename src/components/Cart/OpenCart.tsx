import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <Button
      aria-label={quantity ? `Open cart with ${quantity} items` : 'Open cart'}
      variant="nav"
      size="clear"
      className="navLink relative items-end hover:cursor-pointer"
      {...rest}
    >
      <ShoppingCart aria-hidden="true" className="size-[18px]" />

      {quantity ? <span aria-hidden="true">{quantity}</span> : null}
    </Button>
  )
}
