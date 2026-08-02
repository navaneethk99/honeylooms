'use client'

import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import React from 'react'

const SVG3D = dynamic(() => import('3dsvg').then((module) => module.SVG3D), { ssr: false })

const cartBagSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 640" width="512" height="640">
  <path
    fill="#1848E8"
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M 122 72 L 390 72 L 418 590 L 94 590 Z M 188 158 a 68 22 0 1 0 136 0 a 68 22 0 1 0 -136 0"
  />
</svg>`

type CartBagModelProps = {
  className?: string
  height: number
  width: number
}

export function CartBagModel({ className, height, width }: CartBagModelProps) {
  return (
    <SVG3D
      animate="spin"
      color="#d9a322"
      cursorOrbit={false}
      depth={1.1}
      draggable={false}
      height={height}
      interactive={false}
      intro="none"
      shadow={false}
      smoothness={0}
      svg={cartBagSvg}
      width={width}
      className={className}
    />
  )
}

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
      <CartBagModel height={48} width={42} className="pointer-events-none shrink-0" />

      {quantity ? <span aria-hidden="true">{quantity}</span> : null}
    </Button>
  )
}
