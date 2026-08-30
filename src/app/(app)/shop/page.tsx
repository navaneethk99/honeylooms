import { Grid } from '@/components/Grid'
import { ProductGridSkeleton } from '@/components/NavigationSkeletons'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ShopProductReveal } from '@/components/ShopProductReveal'
import { connection } from 'next/server'
import React, { Suspense } from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
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
  const { q: searchValue, sort, category, collection, page: pageParam } = await searchParams
  const parsedPage = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam)
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    limit: 24,
    page,
    ...(sort ? { sort } : { sort: '_order' }),
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

  const resultsText = products.docs.length > 1 ? 'results' : 'result'
  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams()
    const addParam = (name: string, value: string | string[] | undefined) => {
      const resolvedValue = Array.isArray(value) ? value[0] : value
      if (resolvedValue) params.set(name, resolvedValue)
    }

    addParam('q', searchValue)
    addParam('sort', sort)
    addParam('category', category)
    addParam('collection', collection)
    if (targetPage > 1) params.set('page', String(targetPage))

    const query = params.toString()
    return query ? `/shop?${query}` : '/shop'
  }

  return (
    <div className="">
      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">No products found. Please try different filters.</p>
      )}

      {products?.docs.length > 0 ? (
        <>
          <Grid className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-3">
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
              className="mt-12 flex items-center justify-center"
            >
              <div className="flex items-center font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
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
                  {Array.from({ length: products.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <a
                      key={pageNumber}
                      aria-current={pageNumber === products.page ? 'page' : undefined}
                      className={`flex size-8 items-center justify-center transition-colors ${
                        pageNumber === products.page
                          ? 'bg-[#24231f] text-white dark:bg-neutral-100 dark:text-neutral-950'
                          : 'text-neutral-500 hover:text-[#24231f] dark:text-neutral-400 dark:hover:text-white'
                      }`}
                      href={createPageHref(pageNumber)}
                    >
                      {pageNumber}
                    </a>
                  ))}
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
