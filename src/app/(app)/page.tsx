import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { homeStaticData } from '@/endpoints/seed/home-static'
import React from 'react'
import Link from 'next/link'

import type { Page as PageType, Product } from '@/payload-types'
import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { HomepageAnimation } from '@/components/HomepageAnimation'
import { ProductGridItem } from '@/components/ProductGridItem'
import { generateMeta } from '@/utilities/generateMeta'
import type { Metadata } from 'next'
import { PromoPopup } from '@/components/PromoPopup'
import { RecentlyViewedList } from '@/components/RecentlyViewed'
import { DomeGalleryWrapper as DomeGallery } from '@/components/DomeGallery/DomeGalleryWrapper'
import { InstagramReels } from '@/components/InstagramReels'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

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

  // Fetch all published products to extract their images for the Dome Gallery
  let domeImages: string[] = []
  try {
    const allProductsResult = await payload.find({
      collection: 'products',
      draft: false,
      limit: 100,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })

    domeImages = allProductsResult.docs
      .flatMap((product) => {
        const urls: string[] = []
        if (product.gallery && product.gallery.length > 0) {
          product.gallery.forEach((item) => {
            if (
              item.image &&
              typeof item.image === 'object' &&
              'url' in item.image &&
              item.image.url
            ) {
              urls.push(item.image.url)
            }
          })
        }
        if (
          product.meta &&
          product.meta.image &&
          typeof product.meta.image === 'object' &&
          'url' in product.meta.image &&
          product.meta.image.url
        ) {
          urls.push(product.meta.image.url)
        }
        return urls
      })
      .filter(Boolean)
  } catch (error) {
    console.error('Error fetching products for dome gallery:', error)
  }

  // 1. Fetch the homepage page document
  let page = await getHomepageData()

  if (!page) {
    page = homeStaticData() as PageType
  }

  // 2. Determine outfits from the global configuration
  let outfits: Product[] = []
  try {
    const featuredOutfitsGlobal = await getCachedGlobal('featured-outfits', 2)()
    if (
      featuredOutfitsGlobal &&
      featuredOutfitsGlobal.outfits &&
      featuredOutfitsGlobal.outfits.length > 0
    ) {
      outfits = featuredOutfitsGlobal.outfits.filter(
        (item): item is Product => typeof item === 'object' && item !== null && 'slug' in item,
      )
    }
  } catch (error) {
    console.error('Error loading featured outfits global:', error)
  }

  // Fallback to page-specific featured outfits if global outfits are empty
  if (outfits.length === 0 && page.featuredOutfits && page.featuredOutfits.length > 0) {
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
                equals: collectionDoc.id,
              },
            },
          ],
        },
        limit: 12,
      })

      return {
        collection: collectionDoc,
        products: productsResult.docs as Product[],
      }
    }),
  )

  let instagramReelUrls: string[] = []
  try {
    const instagramReelsGlobal = await getCachedGlobal('instagram-reels', 0)()
    if (instagramReelsGlobal?.reels && instagramReelsGlobal.reels.length > 0) {
      instagramReelUrls = instagramReelsGlobal.reels
        .map((reel) => reel.url)
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 4)
    }
  } catch (error) {
    console.error('Error loading Instagram reels global:', error)
  }

  return (
    <article className="pb-24">
      {/* GSAP ScrollTrigger Intro Animation */}
      {outfits.length > 0 && <HomepageAnimation products={outfits} />}

      {/* Carousel of items from each collection */}
      <div className="bg-background">
        <RecentlyViewedList />
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
                  Explore Full Collection &rarr;
                </Link>
              </div>

              {/* 3-Column Carousel wrapper with desktop padding for navigation arrows */}
              <div className="px-0 md:px-12">
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent className="-ml-4 md:-ml-6">
                    {products.map((product) => (
                      <CarouselItem
                        key={product.id}
                        className="pl-4 md:pl-6 basis-1/2 md:basis-1/3"
                      >
                        <div className="h-full w-full">
                          <ProductGridItem product={product} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex" />
                  <CarouselNext className="hidden md:flex" />
                </Carousel>
              </div>
            </section>
          )
        })}

        <InstagramReels urls={instagramReelUrls} />

        {/* Dome Gallery Section
        {domeImages.length > 0 && (
          <section className="w-full h-[600px] relative overflow-hidden bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900 [--bg-gallery:#ffffff] dark:[--bg-gallery:#0a0a0a]">
            <div className="absolute inset-x-0 top-12 z-10 flex flex-col items-center justify-start pointer-events-none">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white uppercase text-center mb-1">
                Product Gallery
              </h2>
              <p className="text-[10px] tracking-widest text-neutral-500 dark:text-neutral-400 uppercase font-mono text-center">
                Drag to orbit • Click to enlarge
              </p>
            </div>
            <div className="w-full h-full">
              <DomeGallery
                images={domeImages}
                grayscale={false}
                overlayBlurColor="var(--bg-gallery)"
                fit={0.9}
                fitBasis="width"
                minRadius={700}
              />
            </div>
          </section>
        )}
        */}
      </div>
      <PromoPopup />
    </article>
  )
}
