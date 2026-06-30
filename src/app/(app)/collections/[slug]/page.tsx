import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { ChevronLeftIcon } from 'lucide-react'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import configPromise from '@payload-config'
import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { Media } from '@/components/Media'
import type { Collection, Media as MediaType } from '@/payload-types'

type Args = {
  params: Promise<{
    slug: string
  }>
}

const getCollectionBySlug = async (slug: string) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'collections',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}

const getCachedCollectionBySlug = unstable_cache(
  async (slug: string) => getCollectionBySlug(slug),
  ['collections'],
  {
    tags: ['collections'],
  }
)

const queryCollectionBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  if (draft) {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'collections',
      depth: 1,
      draft,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  }

  return getCachedCollectionBySlug(slug)
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const collection = await queryCollectionBySlug({ slug })

  if (!collection) return notFound()

  return {
    title: `${collection.title} Collection`,
    description: `Shop our curated selection of products in the ${collection.title} collection.`,
  }
}

export default async function CollectionSlugPage({ params }: Args) {
  const { slug } = await params
  const collection = (await queryCollectionBySlug({ slug })) as Collection | null

  if (!collection) return notFound()

  const payload = await getPayload({ config: configPromise })

  // Find products associated with this collection
  const products = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    overrideAccess: false,
    limit: 100,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          collections: {
            contains: collection.id,
          },
        },
      ],
    },
  })

  const banner = collection.banner as MediaType | null | undefined

  return (
    <div>
      {/* Banner / Hero Section */}
      <div className="relative aspect-[1983/793] w-full bg-neutral-900 overflow-hidden">
        {banner && (
          <Media
            fill
            className="absolute inset-0 w-full h-full"
            imgClassName="object-cover opacity-80"
            resource={banner}
            size="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-end container pb-12">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-300 uppercase mb-3">
              <Link href="/collections" className="hover:text-white transition-colors duration-300">
                Collections
              </Link>
              <span>/</span>
              <span className="text-white font-medium">{collection.title}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans">
              {collection.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Product Grid Section */}
      <div className="container py-16">
        <Link
          href="/collections"
          className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors duration-300 mb-8 font-mono"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Back to collections</span>
        </Link>

        {products.docs.length === 0 ? (
          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-16 text-center my-8">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              No products found in the "{collection.title}" collection.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-50 dark:hover:bg-neutral-100 dark:text-neutral-950 px-6 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors duration-300"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100 dark:border-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                Showing {products.docs.length} {products.docs.length === 1 ? 'product' : 'products'}
              </p>
            </div>

            <Grid className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.docs.map((product) => (
                <ProductGridItem key={product.id} product={product} />
              ))}
            </Grid>
          </div>
        )}
      </div>
    </div>
  )
}
