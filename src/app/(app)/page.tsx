import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { homeStaticData } from '@/endpoints/seed/home-static'
import React from 'react'
import Link from 'next/link'

import type { Page as PageType, Product } from '@/payload-types'
import { getCachedDocument } from '@/utilities/getDocument'
import { HomepageAnimation } from '@/components/HomepageAnimation'
import { ProductGridItem } from '@/components/ProductGridItem'
import { generateMeta } from '@/utilities/generateMeta'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomepageData()
  return generateMeta({ doc: page as PageType })
}

const getHomepageData = async (): Promise<PageType | null> => {
  const { isEnabled: draft } = await draftMode()

  if (draft) {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        slug: {
          equals: 'home',
        },
      },
    })

    return (result.docs?.[0] as PageType) || null
  }

  return ((await getCachedDocument('pages', 'home')()) as PageType) || null
}

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // 1. Fetch the homepage page document
  let page = await getHomepageData()

  if (!page) {
    page = homeStaticData() as PageType
  }

  // 2. Determine outfits for the GSAP animation
  let outfits: Product[] = []
  if (page.featuredOutfits && page.featuredOutfits.length > 0) {
    outfits = page.featuredOutfits.filter(
      (item): item is Product => typeof item === 'object' && item !== null && 'slug' in item,
    )
  }

  // Fallback to first 6 published products if none selected or populated
  if (outfits.length === 0) {
    const productsResult = await payload.find({
      collection: 'products',
      draft: false,
      limit: 6,
      overrideAccess: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    outfits = productsResult.docs as Product[]
  }

  // 3. Fetch collections and their products for a 3x2 grid (limit 6)
  const collectionsResult = await payload.find({
    collection: 'collections',
    depth: 1,
    limit: 10,
    where: {
      showOnHomePage: {
        equals: true,
      },
    },
  })

  const collectionsWithProducts = await Promise.all(
    collectionsResult.docs.map(async (collectionDoc) => {
      const productsResult = await payload.find({
        collection: 'products',
        where: {
          and: [
            {
              _status: {
                equals: 'published',
              },
            },
            {
              collections: {
                contains: collectionDoc.id,
              },
            },
          ],
        },
        limit: 6,
      })

      return {
        collection: collectionDoc,
        products: productsResult.docs as Product[],
      }
    }),
  )

  return (
    <article className="pb-24">
      {/* GSAP ScrollTrigger Intro Animation */}
      {outfits.length > 0 && <HomepageAnimation products={outfits} />}

      {/* 3x2 grid of items from each collection */}
      <div className="bg-background">
        {collectionsWithProducts.map(({ collection, products }) => {
          if (!products || products.length === 0) return null

          return (
            <section key={collection.id} className="container mx-auto px-4 py-16 md:py-24">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-neutral-100 dark:border-neutral-900 pb-5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl md:text-4xl font-semibold font-sans tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
                    {collection.title}
                  </h2>
                </div>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="text-xs uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mt-4 md:mt-0"
                >
                  Explore Collection &rarr;
                </Link>
              </div>

              {/* 3x2 Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {products.map((product) => (
                  <div key={product.id} className="h-full w-full">
                    <ProductGridItem product={product} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </article>
  )
}
