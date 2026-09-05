'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'

import { trackStorefrontEvent } from '@/utilities/trackStorefrontEvent'

type Props = ComponentProps<typeof Link> & { placement: string }

export function StorefrontLink({ placement, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          trackStorefrontEvent('storefront_cta_clicked', {
            placement,
            destination: typeof props.href === 'string' ? props.href : props.href.pathname,
          })
        }
      }}
    />
  )
}
