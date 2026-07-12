import type { Metadata } from 'next'
import React from 'react'

import { GalleryBentoGrid } from '@/components/GalleryBentoGrid'
import { GalleryUploadDialog } from '@/components/GalleryUploadDialog'
import type { Product } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  description: 'A collection of Honeylooms pieces, worn and shared by our community.',
  title: 'Gallery',
  openGraph: mergeOpenGraph({
    title: 'Gallery',
    url: '/gallery',
  }),
}

export default async function GalleryPage() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const [gallery, products] = await Promise.all([
    payload.find({
      collection: 'gallery',
      depth: 2,
      limit: 100,
      overrideAccess: false,
      sort: '-createdAt',
      where: {
        status: {
          equals: 'approved',
        },
      },
    }),
    payload.find({
      collection: 'products',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      sort: 'title',
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
  ])

  const productOptions = products.docs.map((product) => ({
    id: product.id,
    title: product.title || 'Untitled product',
  }))
  const galleryItems = gallery.docs.flatMap((item) => {
    const url = getMediaUrl(item.url)
    if (!url) return []

    return [
      {
        alt: item.alt || item.filename || 'Honeylooms gallery submission',
        height: item.height,
        id: item.id,
        mimeType: item.mimeType,
        previewUrl: getMediaUrl(item.sizes?.preview?.url),
        products: (item.products || []).filter(
          (product): product is Product => Boolean(product) && typeof product === 'object' && 'slug' in product,
        ),
        submittedBy: item.submittedBy,
        url,
        width: item.width,
      },
    ]
  })

  return (
    <div className="bg-background text-foreground">
      <section className="container py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-xs tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
            Honeylooms in the wild
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-5xl">
            Worn with a story.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            A living collage of the people, places, and little moments that make Honeylooms yours.
          </p>
        </div>
      </section>

      <section className="container pb-16 md:pb-24">
        {galleryItems.length > 0 ? (
          <GalleryBentoGrid items={galleryItems} />
        ) : (
          <div className="border border-dashed border-neutral-200 py-20 text-center dark:border-neutral-800">
            <p className="text-xl font-medium text-neutral-900 dark:text-neutral-50">
              The first stories are on their way.
            </p>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Share yours and help us begin the collage.
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50 dark:border-neutral-900 dark:bg-neutral-950">
        <div className="container flex flex-col items-start justify-between gap-7 py-14 md:flex-row md:items-center md:py-[4.5rem]">
          <div>
            <p className="font-mono text-xs tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
              Your turn
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-4xl">
              Add your piece to the story.
            </h2>
          </div>
          <GalleryUploadDialog products={productOptions} />
        </div>
      </section>
    </div>
  )
}
