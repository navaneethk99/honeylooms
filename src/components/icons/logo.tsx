import clsx from 'clsx'
import React from 'react'
import Image from 'next/image'
export function LogoIcon({ className, ...props }: React.ComponentProps<any>) {
  return (
    <Image
      src="/logo.svg"
      alt="Logo"
      width={1000}
      height={35}
      className={clsx('h-auto', className || 'w-[200px]')}
    />
  )
}
