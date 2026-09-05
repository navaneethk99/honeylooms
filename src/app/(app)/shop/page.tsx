import { Grid } from '@/components/Grid'
import { ProductGridSkeleton } from '@/components/NavigationSkeletons'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ShopProductReveal } from '@/components/ShopProductReveal'
import { SortProducts } from '@/components/layout/search/SortProducts'
import { sorting } from '@/lib/constants'
import { createPageMetadata } from '@/utilities/seo'
import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import React, { Suspense } from 'react'

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || ''

const getPage = (value: string | string[] | undefined) => {
  const parsedPage = Number(firstValue(value))
  return Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const page = getPage(params.page)
  const isFiltered = ['q', 'category', 'collection', 'sort'].some((key) => firstValue(params[key]))

  return createPageMetadata({
    title: `Shop Women’s Clothing${page > 1 ? ` – Page ${page}` : ''}`,
    description:
      'Shop women’s clothing at Honeylooms. Explore the latest styles by category and collection, with free prepaid shipping across India and cash on delivery available.',
    path: !isFiltered && page > 1 ? `/shop?page=${page}` : '/shop',
    noIndex: isFiltered,
  })
}

export default function ShopPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ShopProducts searchParams={searchParams} />
    </Suspense>
  )
}

async function ShopProducts({ searchParams }: Props) {
  await connection()
  const params = await searchParams
  const searchValue = firstValue(params.q)
  const category = firstValue(params.category)
  const collection = firstValue(params.collection)
  const requestedSort = firstValue(params.sort)
  const sort = sorting.find((item) => item.slug === requestedSort)?.slug || '_order'
  const page = getPage(params.page)
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    limit: 24,
    page,
    sort,
    ...(searchValue || category || collection
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          description: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(category
                ? [
                    {
                      categories: {
                        equals: category,
                      },
                    },
                  ]
                : []),
              ...(collection
                ? [
                    {
                      collections: {
                        equals: collection,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.totalDocs === 1 ? 'style' : 'styles'
  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams()
    const addParam = (name: string, value: string | string[] | undefined) => {
      const resolvedValue = Array.isArray(value) ? value[0] : value
      if (resolvedValue) params.set(name, resolvedValue)
    }

    addParam('q', searchValue)
    if (sort !== '_order') addParam('sort', sort)
    addParam('category', category)
    addParam('collection', collection)
    if (targetPage > 1) params.set('page', String(targetPage))

    const query = params.toString()
    return query ? `/shop?${query}` : '/shop'
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        {/*<p aria-live="polite" className="text-sm text-neutral-600">
          {products.totalDocs} {resultsText}
          {searchValue ? <> for <span className="font-medium text-neutral-900">“{searchValue}”</span></> : null}
          {products.totalPages > 1 ? ` · Page ${page} of ${products.totalPages}` : ''}
        </p>*/}
        <h1 className="font-dream-orphanage text-[2rem] leading-none tracking-[-0.035em]">
          Shop All Products
        </h1>
        <SortProducts />
      </div>

      {products.docs.length === 0 ? (
        <div className="border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
          <h2 className="text-xl font-medium text-neutral-900">Let’s find something you’ll love</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
            {searchValue || category || collection
              ? 'No styles match these filters. Try another search or explore the full collection.'
              : 'There are no styles on this page. Explore our collections for more inspiration.'}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#24231f] px-6 py-3 text-sm font-medium text-white hover:bg-[#3a3934]"
            href={searchValue || category || collection || page > 1 ? '/shop' : '/collections'}
          >
            {searchValue || category || collection || page > 1
              ? 'Browse all styles'
              : 'Explore collections'}
          </Link>
        </div>
      ) : null}

      {products?.docs.length > 0 ? (
        <>
          <Grid className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
            {products.docs.map((product) => {
              return (
                <ShopProductReveal key={product.id}>
                  <ProductGridItem product={product} />
                </ShopProductReveal>
              )
            })}
          </Grid>

          {products.totalPages > 1 ? (
            <nav
              aria-label="Product pagination"
              className="mt-12 flex items-center justify-center overflow-x-auto"
            >
              <div className="flex flex-wrap items-center justify-center font-mono text-xs font-medium uppercase tracking-[0.12em]">
                {products.hasPrevPage ? (
                  <a
                    aria-label="Previous page"
                    className="flex size-8 items-center justify-center text-neutral-500 transition-colors hover:text-[#24231f] dark:text-neutral-400 dark:hover:text-white"
                    href={createPageHref(page - 1)}
                  >
                    ←
                  </a>
                ) : null}

                <div className="mx-1 flex items-center">
                  {Array.from({ length: products.totalPages }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <a
                        key={pageNumber}
                        aria-current={pageNumber === products.page ? 'page' : undefined}
                        className={`flex size-11 items-center justify-center transition-colors ${
                          pageNumber === products.page
                            ? 'bg-[#24231f] text-white dark:bg-neutral-100 dark:text-neutral-950'
                            : 'text-neutral-500 hover:text-[#24231f] dark:text-neutral-400 dark:hover:text-white'
                        }`}
                        href={createPageHref(pageNumber)}
                      >
                        {pageNumber}
                      </a>
                    ),
                  )}
                </div>

                {products.hasNextPage ? (
                  <a
                    aria-label="Next page"
                    className="flex size-8 items-center justify-center text-neutral-500 transition-colors hover:text-[#24231f] dark:text-neutral-400 dark:hover:text-white"
                    href={createPageHref(page + 1)}
                  >
                    →
                  </a>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
