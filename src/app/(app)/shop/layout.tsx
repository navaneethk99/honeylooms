import { Categories } from '@/components/layout/search/Categories'
import { Collections } from '@/components/layout/search/Collections'
import { ClearFilters } from '@/components/layout/search/ClearFilters'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          <aside className="relative flex w-full flex-none flex-col gap-4 md:top-0 md:z-10 md:w-48 md:basis-48 md:self-start md:gap-0 md:border md:border-[#24231f]/30 md:bg-[#f5f1e8] lg:w-56 lg:basis-56">
            <header className="relative hidden bg-[#D9A322] px-4 pb-4 pt-5 text-[#f5f1e8] md:block">
              <h2 className="font-editorial text-[1.7rem] leading-none tracking-[-0.035em]">
                Filters
              </h2>
            </header>

            <ClearFilters />
            <div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:gap-6 md:px-4 md:py-5">
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
