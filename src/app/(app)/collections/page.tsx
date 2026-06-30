import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'

export const metadata = {
  description: 'Browse our curated product collections.',
  title: 'Collections',
}

export default async function CollectionsPage() {
  const payload = await getPayload({ config: configPromise })

  const collections = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    limit: 100,
  })

  return (
    <div className="container py-16">
      {/* Hero Header */}
      <div className="max-w-2xl mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-4 font-sans">
          Curated Collections
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed">
          Explore our handpicked selections of premium products, designed to bring style, quality, and functionality to your everyday life.
        </p>
      </div>

      {/* Grid of collections */}
      {collections.docs.length === 0 ? (
        <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">No collections found. Add some collections in the admin panel to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {collections.docs.map((collection) => {
            const poster = collection.poster as MediaType | null | undefined
            const title = collection.title
            const slug = collection.slug

            return (
              <Link
                key={collection.id}
                href={`/collections/${slug}`}
                className="group block space-y-4"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-900">
                  {/* Background Image with Hover Zoom */}
                  {poster ? (
                    <Media
                      fill
                      className="absolute inset-0 w-full h-full"
                      imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                      resource={poster}
                      size="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content Below */}
                <div>
                  <h2 className="text-neutral-900 dark:text-neutral-100 text-lg font-medium tracking-wide mb-1 transition-colors group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                    {title}
                  </h2>
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest text-neutral-400 dark:text-neutral-500 uppercase transition-all duration-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                    <span>Explore Collection</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
