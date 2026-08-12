import { Categories } from '@/components/layout/search/Categories'
import { Collections } from '@/components/layout/search/Collections'
import { ClearFilters } from '@/components/layout/search/ClearFilters'
import { cookies } from 'next/headers'
import React, { Suspense } from 'react'

type ShopTheme = 'blue' | 'brown' | 'navy' | 'pink' | 'red'

const isShopTheme = (value: string | undefined): value is ShopTheme =>
  value === 'blue' || value === 'brown' || value === 'navy' || value === 'pink' || value === 'red'

const shopThemeClasses: Record<ShopTheme, string> = {
  blue: 'bg-[#1d469f]',
  brown: 'bg-[#9f442f]',
  navy: 'bg-[#24336f]',
  pink: 'bg-[#df4d91]',
  red: 'bg-[#c51c25]',
}

async function ShopFilterHeader() {
  const cookieStore = await cookies()
  const storedTheme = cookieStore.get('honeylooms-theme')?.value
  const shopTheme = isShopTheme(storedTheme) ? storedTheme : 'navy'

  return (
    <header
      className={`relative hidden px-4 pb-4 pt-5 text-white md:block ${shopThemeClasses[shopTheme]}`}
    >
      <h2 className="font-editorial text-[1.7rem] leading-none tracking-[-0.035em]">Filters</h2>
    </header>
  )
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container my-16 flex flex-col gap-8 pb-4">
      <div className="flex flex-col items-start justify-between gap-16 md:flex-row md:gap-4">
        <aside className="relative flex w-full flex-none flex-col gap-4 md:top-0 md:z-10 md:w-48 md:basis-48 md:self-start md:gap-0 md:border md:border-[#24231f]/30 md:bg-white lg:w-56 lg:basis-56">
          <Suspense
            fallback={
              <header className="relative hidden bg-[#24336f] px-4 pt-5 pb-4 text-white md:block">
                <h2 className="font-editorial text-[1.7rem] leading-none tracking-[-0.035em]">
                  Filters
                </h2>
              </header>
            }
          >
            <ShopFilterHeader />
          </Suspense>

          <ClearFilters />
          <div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:gap-6 md:px-4 md:py-5">
            <Categories />
            <Collections />
          </div>
        </aside>
        <div className="min-h-screen w-full">{children}</div>
      </div>
    </div>
  )
}
