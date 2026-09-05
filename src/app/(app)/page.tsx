import configPromise from '@payload-config'
import { ArrowUpRight, CreditCard, Ruler, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { connection } from 'next/server'
import { getPayload } from 'payload'

import { HomepageProductCard } from '@/components/HomepageProductCard'
import { HomepageProductReveal } from '@/components/HomepageProductReveal'
import { HomepageBannerMedia } from '@/components/HomepageBannerMedia'
import { HomepageCategoryReveal } from '@/components/HomepageCategoryReveal'
import { HomepageSectionReveal } from '@/components/HomepageSectionReveal'
import { InstagramReels } from '@/components/InstagramReels'
import { Media } from '@/components/Media'
import { PromoPopup } from '@/components/PromoPopup'
import { ShoppingQuestions } from '@/components/ShoppingQuestions'
import { StorefrontLink } from '@/components/StorefrontLink'
import type {
  Category,
  Collection,
  Media as MediaType,
  Page as PageType,
  Product,
} from '@/payload-types'
import { createPageMetadata } from '@/utilities/seo'
import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomepageData()
  const { isEnabled: draft } = await draftMode()
  return createPageMetadata({
    title: page?.meta?.title || 'Handcrafted Kurtis, Bralettes & Cotton Clothing',
    description:
      page?.meta?.description ||
      'Shop Honeylooms handcrafted kurtis, Indo-traditional bralettes and halter necks. Made in India, with free prepaid shipping across India and guest checkout.',
    image: typeof page?.meta?.image === 'object' ? page.meta.image : undefined,
    noIndex: draft,
    path: '/',
  })
}

const getHomepageData = async (): Promise<PageType | null> => {
  const { isEnabled: draft } = await draftMode()

  if (draft) {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      draft,
      depth: 2,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: { slug: { equals: 'home' } },
    })

    return (result.docs?.[0] as PageType) || null
  }

  return ((await getCachedDocument('pages', 'home', 2)) as PageType) || null
}

export default async function HomePage() {
  await connection()

  return <HomePageContent />
}

async function HomePageContent() {
  const payload = await getPayload({ config: configPromise })

  const [
    productsResult,
    categoriesResult,
    collectionsResult,
    homepageBannersResult,
    instagramReelsGlobal,
  ] = await Promise.all([
    payload.find({
      collection: 'products',
      depth: 2,
      draft: false,
      limit: 8,
      overrideAccess: false,
      // Products are manually arranged in the dashboard; preserve that order on the homepage.
      sort: '_order',
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'categories',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      sort: 'title',
    }),
    payload.find({
      collection: 'collections',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'homepage-banners',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      sort: '-updatedAt',
      where: { active: { equals: true } },
    }),
    getCachedGlobal('instagram-reels', 0).catch(() => null),
  ])

  const products = productsResult.docs as Product[]
  const featuredProducts = products.slice(0, 8)
  const homepageBanners = homepageBannersResult.docs.flatMap((banner) => {
    const desktopImage =
      banner.desktopImage && typeof banner.desktopImage === 'object' ? banner.desktopImage : null
    const mobileImage =
      banner.mobileImage && typeof banner.mobileImage === 'object' ? banner.mobileImage : null
    // Serve the largest generated asset from R2. The original upload is retained
    // only as a fallback for media uploaded before banner variants existed.
    const desktopSrc = getMediaUrl(desktopImage?.sizes?.bannerLarge?.url || desktopImage?.url)
    const mobileSrc = getMediaUrl(mobileImage?.sizes?.bannerLarge?.url || mobileImage?.url)

    if (!desktopImage || !mobileImage || !desktopSrc || !mobileSrc) return []

    return [
      {
        alt: desktopImage.alt || mobileImage.alt || '',
        desktopSrc,
        id: String(banner.id),
        mobileSrc,
        rotationDelay: banner.rotationDelay ?? 5,
      },
    ]
  })
  const categories = categoriesResult.docs
    .map((category) => ({ category, image: category.image }))
    .filter((item): item is { category: Category; image: MediaType } =>
      Boolean(item.image && typeof item.image === 'object'),
    )
    .slice(0, 4)

  const homepageCollections = collectionsResult.docs.filter(
    (collection) => collection.showOnHomePage,
  )
  const collections = (
    homepageCollections.length > 0 ? homepageCollections : collectionsResult.docs
  ).slice(0, 3) as Collection[]

  const instagramReelUrls =
    instagramReelsGlobal?.reels
      ?.map((reel) => reel.url)
      .filter((url): url is string => Boolean(url?.trim()))
      .slice(0, 4) ?? []

  return (
    <article className="home-page overflow-hidden bg-white text-[#24231f]">
      <h1 className="sr-only">Honeylooms handcrafted kurtis, bralettes and cotton clothing</h1>
      <nav
        aria-label="Shopping information"
        className="border-b border-[#24231f]/15 px-5 md:px-10 lg:px-14"
      >
        <div className="mx-auto flex max-w-[1500px] flex-wrap justify-between gap-x-5 gap-y-1 py-3 text-xs text-[#5d594f]">
          <Link
            className="inline-flex min-h-9 items-center gap-2 hover:underline"
            href="/deliveries-and-returns"
          >
            <Truck className="size-4" aria-hidden="true" />
            Free prepaid shipping in India
          </Link>
          <Link
            className="inline-flex min-h-9 items-center gap-2 hover:underline"
            href="/deliveries-and-returns"
          >
            <CreditCard className="size-4" aria-hidden="true" />
            Cash on Delivery
          </Link>
          <Link className="inline-flex min-h-9 items-center gap-2 hover:underline" href="/sizing">
            <Ruler className="size-4" aria-hidden="true" />
            Find your fit with our size guide
          </Link>
        </div>
      </nav>

      {homepageBanners.length > 0 ? (
        <section aria-label="From the Honeylooms studio" className="border-y border-[#24231f]/15">
          <div className="relative aspect-[10/17] overflow-hidden md:aspect-[17/10]">
            <HomepageBannerMedia banners={homepageBanners} />
          </div>
          <div className="flex justify-center bg-[#f6f3ed] px-5 py-5">
            <StorefrontLink
              placement="home_campaign_shop"
              className="inline-flex min-h-12 items-center gap-4 bg-[#24231f] px-6 text-sm font-medium text-white hover:bg-[#464238]"
              href="/shop"
            >
              Explore the shop <ArrowUpRight aria-hidden="true" className="size-4" />
            </StorefrontLink>
          </div>
        </section>
      ) : null}
      {featuredProducts.length > 0 ? (
        <section id="latest-arrivals" className="px-5 py-10 md:px-10 md:py-14 lg:px-14">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-9 flex items-end justify-between gap-5 md:mb-12">
              <div>
                {/*<p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[#6d685f]">
                  Fresh from the studio
                </p>*/}
                <h2 className="font-dream-orphanage text-4xl leading-none md:text-6xl">
                  Find your next favourite
                </h2>
              </div>
              <Link
                className="group hidden items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] transition-colors hover:border-[#24231f] sm:inline-flex"
                href="/shop"
              >
                Shop all styles
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <HomepageProductReveal>
              {featuredProducts.map((product) => (
                <HomepageProductCard key={product.id} product={product} />
              ))}
            </HomepageProductReveal>

            <Link
              className="mt-10 inline-flex items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] sm:hidden"
              href="/shop"
            >
              Shop all styles
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* <section className="relative h-64 overflow-hidden border-b border-[#24231f]/20 bg-[#D9A322] text-[#24231f] md:h-96">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-right bg-repeat-x opacity-[0.52] md:bg-center md:opacity-[0.82]"
          style={{
            backgroundImage: "url('/madhubani-art-pattern.svg')",
            backgroundSize: 'auto 100%',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#D9A322]/45 md:bg-[linear-gradient(90deg,rgba(217,163,34,0.96)_0%,rgba(217,163,34,0.88)_43%,rgba(217,163,34,0.38)_66%,rgba(217,163,34,0.08)_100%)]"
        />
        <div className="relative z-10 mx-auto flex h-full max-w-[1500px] items-center px-5 py-10 md:px-10 md:py-14 lg:px-14">
          <p className="max-w-[100rem] font-dream-orphanage text-[1.75rem] leading-[1.03] tracking-[-0.025em] sm:text-4xl md:w-[70%] md:text-5xl xl:text-6xl">
            Tradition doesn’t have to stay traditional. India’s rich heritage of handcrafted
            textiles deserves to evolve with every generation.
          </p>
        </div>
      </section> */}

      {categories.length > 0 ? (
        <section
          id="shop-by-category"
          className="scroll-mt-8 bg-white px-5 py-6 text-[#24231f] md:px-10 md:py-8 lg:px-14"
        >
          <HomepageCategoryReveal>
            <div className="mb-9 md:mb-12 md:flex md:items-end md:justify-between">
              <div data-category-heading>
                {/*<p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[#6d685f]">
                  Find your silhouette
                </p>*/}
                <h2 className="font-dream-orphanage text-4xl leading-none tracking-[-0.03em] md:text-6xl">
                  Shop by category
                </h2>
              </div>
              <p
                className="mt-5 max-w-sm text-sm leading-relaxed text-[#6d685f] md:mt-0"
                data-category-description
              >
                Everyday forms, expressive details, and silhouettes designed for repeat wear.
              </p>
            </div>

            <div
              className={
                categories.length === 1
                  ? 'flex justify-center'
                  : `mx-auto grid grid-cols-2 items-start justify-items-center gap-x-6 gap-y-12 ${
                      categories.length === 2
                        ? 'max-w-2xl'
                        : categories.length === 3
                          ? 'max-w-4xl md:grid-cols-3'
                          : 'max-w-5xl lg:grid-cols-4'
                    }`
              }
            >
              {categories.map(({ category, image }, index) => (
                <Link
                  aria-label={`Shop ${category.title}`}
                  className={`group relative aspect-[2/3] w-full max-w-[20rem] self-start overflow-hidden bg-[#ded8cc] shadow-[8px_8px_0_#24231f] ${
                    index % 2 === 1 ? 'lg:mt-12' : ''
                  }`}
                  data-category-card
                  href={`/shop?category=${category.id}`}
                  key={category.id}
                >
                  <Media
                    fill
                    className="absolute inset-0"
                    imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    resource={image}
                    size="(max-width: 768px) 50vw, 25vw"
                  />
                  <span className="absolute inset-x-0 top-0 bg-[#302F29] px-4 py-3 font-dream-orphanage text-xl leading-none text-white md:px-5 md:py-4 md:text-2xl">
                    {category.title}
                  </span>
                </Link>
              ))}
            </div>
          </HomepageCategoryReveal>
        </section>
      ) : null}

      {/* <section className="relative h-64 overflow-hidden border-b border-[#24231f]/20 bg-[#8f3f32] px-5 py-16 text-white md:h-96 md:px-10 md:py-24 lg:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-repeat-x opacity-[0.18] [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]"
          style={{
            backgroundImage: "url('/warli-art-pattern.svg')",
            backgroundPosition: 'center',
            backgroundSize: '960px 360px',
          }}
        />
        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-8 md:grid-cols-12 md:items-end">
          <p className="font-dream-orphanage text-3xl leading-[1.05] tracking-[-0.02em] sm:text-4xl md:col-span-8 md:text-5xl lg:text-6xl">
            Rooted in Indian craft. Made with a modern ease. Pieces that feel considered, never
            overdone.
          </p>
        </div>
      </section> */}

      {collections.length > 0 ? (
        <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
          <HomepageSectionReveal motion="collections">
            <div className="mb-9 flex items-end justify-between gap-5 md:mb-12">
              <div data-reveal-heading>
                {/*<p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[#6d685f]">
                  Stories in cloth
                </p>*/}
                <h2 className="font-dream-orphanage text-4xl leading-none tracking-[-0.03em] md:text-6xl">
                  Shop collections
                </h2>
              </div>
              <Link
                className="group hidden items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] hover:border-[#24231f] sm:inline-flex"
                data-reveal-action
                href="/collections"
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div
              className={
                collections.length === 1
                  ? 'flex justify-center'
                  : 'mx-auto grid max-w-5xl justify-items-center gap-4 md:grid-cols-3'
              }
            >
              {collections.map((collection, index) => {
                const poster = collection.poster as MediaType | null
                return (
                  <Link
                    aria-label={`Shop the ${collection.title} collection`}
                    className="group relative aspect-[2/3] w-full max-w-[20rem] self-start overflow-hidden bg-[#ded8cc] shadow-[8px_8px_0_#24231f]"
                    data-reveal-card
                    href={`/collections/${collection.slug}`}
                    key={collection.id}
                  >
                    {poster ? (
                      <Media
                        fill
                        className="absolute inset-0"
                        imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                        resource={poster}
                        size={
                          index === 0
                            ? '(max-width: 768px) 100vw, 50vw'
                            : '(max-width: 768px) 100vw, 25vw'
                        }
                      />
                    ) : null}
                    <div className="absolute inset-0 " />
                  </Link>
                )
              })}
            </div>
          </HomepageSectionReveal>
        </section>
      ) : null}

      <InstagramReels urls={instagramReelUrls} />

      <ShoppingQuestions />

      {/* <section className="grid border-y border-[#24231f]/15 bg-[#ebe5da] sm:grid-cols-3">
        {[
          ['01', 'Considered design', 'Modern silhouettes grounded in Indian craft.'],
          ['02', 'Secure checkout', 'Trusted payments with multiple ways to pay.'],
          ['03', 'Here to help', 'Support before, during, and after your order.'],
        ].map(([number, title, copy]) => (
          <div
            className="border-b border-[#24231f]/15 px-5 py-8 last:border-b-0 sm:border-b-0 sm:border-r sm:px-8 sm:last:border-r-0 md:py-10"
            key={number}
          >
            <span className="text-[9px] tracking-[0.18em] text-[#777166]">{number}</span>
            <h2 className="mt-6 font-dream-orphanage text-2xl">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#6d685f]">{copy}</p>
          </div>
        ))}
      </section> */}

      <PromoPopup />
    </article>
  )
}
