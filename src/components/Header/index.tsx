import { getCachedGlobal } from '@/utilities/getGlobals'

import './index.css'
import { HeaderClient } from './index.client'
import { PromoBanner } from './PromoBanner'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()
  const promoBanner = await getCachedGlobal('promo-banner', 1)()

  return (
    <>
      <HeaderClient header={header} />
      <PromoBanner promoBanner={promoBanner} />
    </>
  )
}

