import { Categories } from '@/components/layout/search/Categories'
import { Collections } from '@/components/layout/search/Collections'
import { ClearFilters } from '@/components/layout/search/ClearFilters'
import Link from 'next/link'
import React, { Suspense } from 'react'

function ShopFilterHeader() {
  return (
    <header className="relative hidden bg-[#D9A322] px-4 pb-4 pt-5 text-white md:block">
      <h2 className="font-dream-orphanage text-[1.7rem] leading-none tracking-[-0.035em]">
        Filters
      </h2>
    </header>
  )
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container my-8 flex flex-col gap-8 pb-4 md:my-12">
      {/*<header className="max-w-3xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#8a6410]">
          The Honeylooms wardrobe
        </p>
        <h1 className="font-dream-orphanage text-4xl tracking-tight text-[#24231f] md:text-5xl">
          Shop women’s clothing
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
          Explore women’s clothing for everyday plans and special occasions. Browse by category or
          collection, then find your fit on each product page.
        </p>
        <p className="mt-3 text-sm text-neutral-600">
          Free prepaid shipping across India. Cash on delivery available.{' '}
          <Link className="underline underline-offset-4 hover:text-neutral-950" href="/deliveries-and-returns">
            Delivery &amp; returns
          </Link>
        </p>
      </header>*/}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:gap-6">
        <aside className="relative flex w-full flex-none flex-col gap-4 md:top-0 md:z-10 md:w-48 md:basis-48 md:self-start md:gap-0 md:border md:border-[#24231f]/30 md:bg-white lg:w-56 lg:basis-56">
          <Suspense
            fallback={
              <header className="relative hidden bg-[#D9A322] px-4 pb-4 pt-5 text-white md:block">
                <h2 className="font-dream-orphanage text-[1.7rem] leading-none tracking-[-0.035em]">
                  Filters
                </h2>
              </header>
            }
          >
            <ShopFilterHeader />
          </Suspense>

          <Suspense fallback={null}>
            <ClearFilters />
          </Suspense>
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
