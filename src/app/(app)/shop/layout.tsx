import { Categories } from '@/components/layout/search/Categories'
import { Collections } from '@/components/layout/search/Collections'
import { ClearFilters } from '@/components/layout/search/ClearFilters'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          <aside className="relative flex w-full flex-none flex-col gap-4 md:sticky md:top-28 md:w-48 md:basis-48 md:self-start lg:w-56 lg:basis-56">
            <header className="relative hidden border-b border-[#24231f]/20 pb-4 pr-20 md:block">
              <h2 className="font-editorial text-3xl leading-none tracking-[-0.035em] text-[#24231f]">
                Filters
              </h2>
            </header>

            <ClearFilters />
            <div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:gap-7">
              <Categories />
              <Collections />
            </div>
          </aside>
          <div className="min-h-screen w-full">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
