import configPromise from '@payload-config'
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { CollectionsGridSkeleton } from '@/components/NavigationSkeletons'
import type { Media as MediaType } from '@/payload-types'
import type { MastheadVariant } from '@/components/HomepageMasthead'

const isMastheadVariant = (value?: string): value is MastheadVariant =>
  value === 'red' || value === 'blue' || value === 'pink' || value === 'navy' || value === 'brown'

const collectionBorderClasses: Record<MastheadVariant, string> = {
  blue: 'border-[#5b8ee9]',
  brown: 'border-[#ed9478]',
  navy: 'border-[#6376bd]',
  pink: 'border-[#ffb2d6]',
  red: 'border-[#f76b5e]',
}

export const metadata = {
  description: 'Browse our curated product collections.',
  title: 'Collections',
}

export default async function CollectionsPage() {
  const cookieStore = await cookies()
  const storedTheme = cookieStore.get('honeylooms-theme')?.value
  const collectionBorderClass =
    collectionBorderClasses[isMastheadVariant(storedTheme) ? storedTheme : 'navy']

  return (
    <div className="container py-16">
      <div className="mb-16 max-w-2xl">
        <h1 className="font-dream-orphanage mb-4 text-4xl font-semibold text-neutral-900 dark:text-neutral-50 md:text-5xl">
          Curated Collections
        </h1>
        <p className="font-dream-orphanage text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
          Explore our handpicked selections of premium products, designed to bring style, quality,
          and functionality to your everyday life.
        </p>
      </div>

      <Suspense fallback={<CollectionsGridSkeleton />}>
        <CollectionCards borderClass={collectionBorderClass} />
      </Suspense>
    </div>
  )
}

async function CollectionCards({ borderClass }: { borderClass: string }) {
  'use cache'
  cacheLife('days')
  cacheTag('collections')

  const payload = await getPayload({ config: configPromise })

  const collections = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    limit: 100,
  })

  if (collections.docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 p-12 text-center dark:border-neutral-800">
        <p className="text-neutral-500 dark:text-neutral-400">
          No collections found. Add some collections in the admin panel to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {collections.docs.map((collection) => {
        const poster = collection.poster as MediaType | null | undefined

        return (
          <Link
            className="group block space-y-4"
            href={`/collections/${collection.slug}`}
            key={collection.id}
          >
            <div
              className={`relative aspect-[2/3] shadow-[0_0_10px_rgba(0,0,0,0.2)] overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${borderClass}`}
            >
              {poster ? (
                <Media
                  fill
                  className="absolute inset-0 h-full w-full"
                  imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                  resource={poster}
                  size="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
                  No Image
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-1 text-lg font-medium tracking-wide text-neutral-900 transition-colors group-hover:text-neutral-600 dark:text-neutral-100 dark:group-hover:text-neutral-300">
                {collection.title}
              </h2>
              <div className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-neutral-400 uppercase transition-all duration-300 group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-neutral-100">
                <span>Explore Collection</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
