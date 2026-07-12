import { connection } from 'next/server'

import { getGlobal } from '@/utilities/getGlobals'

import './index.css'
import { HeaderClient } from './index.client'
import { PromoBanner } from './PromoBanner'

export async function Header() {
  // Navigation is managed in Payload and must reflect admin changes immediately.
  await connection()
  const [header, promoBanner] = await Promise.all([
    getGlobal('header', 1),
    getGlobal('promo-banner', 1),
  ])

  return (
    <>
      <HeaderClient header={header} />
      <PromoBanner promoBanner={promoBanner} />
    </>
  )
}
