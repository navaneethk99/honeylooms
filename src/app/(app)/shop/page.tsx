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
  const { q: searchValue, sort, category, collection } = await searchParams
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    ...(sort ? { sort } : { sort: '-createdAt' }),
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
        <Grid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {products.docs.map((product) => {
            return (
              <ShopProductReveal key={product.id}>
                <ProductGridItem product={product} />
              </ShopProductReveal>
            )
          })}
        </Grid>
      ) : null}
    </div>
  )
}
