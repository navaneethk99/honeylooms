import { connection } from 'next/server'

import { getGlobal } from '@/utilities/getGlobals'

import './index.css'
import { HeaderClient } from './index.client'
import { PromoBanner } from './PromoBanner'

export async function Header() {
  // Navigation is managed in Payload and must reflect admin changes immediately.
  await connection()
  const promoBannerPromise = getGlobal('promo-banner', 1).catch((error) => {
    console.warn(
      'Promo banner unavailable; rendering the header without it.',
      error instanceof Error ? error.message : error,
    )
    return null
  })

  const [header, promoBanner] = await Promise.all([getGlobal('header', 1), promoBannerPromise])

  return (
    <>
      <HeaderClient header={header} />
      <PromoBanner promoBanner={promoBanner} />
    </>
  )
}
