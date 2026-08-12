import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { connection } from 'next/server'
import React, { Suspense } from 'react'
import { ChevronLeftIcon } from 'lucide-react'
import { getPayload } from 'payload'
import { cacheLife, cacheTag } from 'next/cache'

import configPromise from '@payload-config'
import { Grid } from '@/components/Grid'
import { CollectionPageSkeleton, ProductGridSkeleton } from '@/components/NavigationSkeletons'
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

async function getCachedCollectionBySlug(slug: string) {
  'use cache'
  cacheLife('days')
  cacheTag('collections')

  return getCollectionBySlug(slug)
}

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

export default function CollectionSlugPage({ params }: Args) {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <CollectionContent params={params} />
    </Suspense>
  )
}

async function CollectionContent({ params }: Args) {
  const { slug } = await params
  const collection = (await queryCollectionBySlug({ slug })) as Collection | null

  if (!collection) return notFound()

  const banner = collection.banner as MediaType | null | undefined
  const spotifyPlaylistUrl = collection.spotifyPlaylistUrl?.trim()
  const appleMusicPlaylistUrl = collection.appleMusicPlaylistUrl?.trim()
  const hasPlaylistLinks = Boolean(spotifyPlaylistUrl || appleMusicPlaylistUrl)

  return (
    <div data-testid="collection-page-shell">
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

        <Suspense fallback={<ProductGridSkeleton />}>
          <CollectionProducts collection={collection} />
        </Suspense>

        {hasPlaylistLinks && (
          <div className="mt-14 border-t border-neutral-100 dark:border-neutral-900 pt-8">
            <h1 className="text-center mb-5 text-xl font-medium">
              Immerse yourself in the sound of {collection.title} with our carefully curated
              playlist :)
            </h1>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              {spotifyPlaylistUrl && (
                <Link
                  href={spotifyPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Listen to the ${collection.title} playlist on Spotify`}
                  className="inline-flex h-12 w-64 items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-900"
                >
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    Listen on
                  </span>
                  <img src="/Spotify_logo_with_text.svg.webp" alt="" width={110} height={26} />
                </Link>
              )}

              {appleMusicPlaylistUrl && (
                <Link
                  href={appleMusicPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Listen to the ${collection.title} playlist on Apple Music`}
                  className="inline-flex h-12 w-64 items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800 px-4 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-900"
                >
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    Listen on
                  </span>
                  <span className="flex items-center gap-2">
                    <img
                      src="/Apple_Music_icon.svg.webp"
                      alt=""
                      width={26}
                      height={26}
                      className="h-[30px] w-[30px] rounded-md"
                    />
                    <span className="text-md font-semibold leading-none tracking-tight">
                      Apple Music
                    </span>
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function CollectionProducts({ collection }: { collection: Collection }) {
  await connection()
  const payload = await getPayload({ config: configPromise })
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
            equals: collection.id,
          },
        },
      ],
    },
  })

  if (products.docs.length === 0) {
    return (
      <div className="my-8 rounded-lg border border-dashed border-neutral-200 p-16 text-center dark:border-neutral-800">
        <p className="mb-4 text-neutral-500 dark:text-neutral-400">
          No products found in the &quot;{collection.title}&quot; collection.
        </p>
        <Link
          className="inline-flex items-center justify-center bg-neutral-900 px-6 py-2.5 font-mono text-xs tracking-widest text-white uppercase transition-colors duration-300 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-100"
          href="/shop"
        >
          Browse All Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-900">
        <p className="font-mono text-sm text-neutral-500 dark:text-neutral-400">
          Showing {products.docs.length} {products.docs.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      <Grid className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.docs.map((product) => (
          <ProductGridItem key={product.id} product={product} />
        ))}
      </Grid>
    </div>
  )
}
