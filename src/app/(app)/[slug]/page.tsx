import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { StorefrontPageSkeleton } from '@/components/NavigationSkeletons'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { homeStaticData } from '@/endpoints/seed/home-static'
import React, { Suspense } from 'react'

import type { Page } from '@/payload-types'
import { notFound } from 'next/navigation'
import { getCachedDocument } from '@/utilities/getDocument'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default function Page({ params }: Args) {
  return (
    <Suspense fallback={<StorefrontPageSkeleton />}>
      <CMSPage params={params} />
    </Suspense>
  )
}

async function CMSPage({ params }: Args) {
  const { slug = 'home' } = await params

  let page = await queryPageBySlug({
    slug,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStaticData() as Page
  }

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({
    slug,
  })

  return generateMeta({ doc: page as Page })
}

const queryPageBySlug = async ({ slug }: { slug: string }): Promise<Page | null> => {
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
        and: [
          {
            slug: {
              equals: slug,
            },
          },
        ],
      },
    })

    return (result.docs?.[0] as Page) || null
  }

  return ((await getCachedDocument('pages', slug)) as Page) || null
}
