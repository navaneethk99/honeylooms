import clsx from 'clsx'
import React from 'react'
import Image from 'next/image'
export function LogoIcon(props: React.ComponentProps<'svg'>) {
  return <Image src="/logo.svg" alt="Logo" width={200} height={25} />
}
