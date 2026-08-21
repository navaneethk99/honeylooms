import configPromise from '@payload-config'
import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { cookies, draftMode } from 'next/headers'
import Link from 'next/link'
import { connection } from 'next/server'
import { getPayload } from 'payload'
import { cache, Suspense } from 'react'

import { HomepageProductCard } from '@/components/HomepageProductCard'
import { HomepageProductReveal } from '@/components/HomepageProductReveal'
import { HomepageMasthead, type MastheadVariant } from '@/components/HomepageMasthead'
import { HomepageCategoryReveal } from '@/components/HomepageCategoryReveal'
import { HomepageIntro, HomepageIntroFadeOut } from '@/components/HomepageIntro'
import { HomepageScrollControl } from '@/components/HomepageScrollControl'
import { HomepageSectionReveal } from '@/components/HomepageSectionReveal'
import { InstagramReels } from '@/components/InstagramReels'
import { Media } from '@/components/Media'
import { PromoPopup } from '@/components/PromoPopup'
import type {
  Category,
  Collection,
  Media as MediaType,
  Page as PageType,
  Product,
} from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedGlobal } from '@/utilities/getGlobals'

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

const getProductMedia = (product?: Product | null): MediaType | null => {
  const image = product?.gallery?.[0]?.image
  return image && typeof image === 'object' ? image : null
}

const productHasCategory = (product: Product, categoryID: Category['id']) =>
  product.categories?.some((category) =>
    typeof category === 'object' ? category.id === categoryID : category === categoryID,
  ) ?? false

type HomePageProps = {
  searchParams: Promise<{ theme?: string }>
}

const isMastheadVariant = (value?: string): value is MastheadVariant =>
  value === 'red' || value === 'blue' || value === 'pink' || value === 'navy' || value === 'brown'

const getRandomMastheadVariant = cache((): MastheadVariant => {
  const randomVariant = Math.random()

  if (randomVariant < 0.2) return 'red'
  if (randomVariant < 0.4) return 'blue'
  if (randomVariant < 0.6) return 'pink'
  if (randomVariant < 0.8) return 'navy'
  return 'brown'
})

export default async function HomePage({ searchParams }: HomePageProps) {
  await connection()
  const { theme } = await searchParams
  const cookieStore = await cookies()
  const storedTheme = cookieStore.get('honeylooms-theme')?.value
  const mastheadVariant =
    process.env.NODE_ENV === 'development' && isMastheadVariant(theme)
      ? theme
      : isMastheadVariant(storedTheme)
        ? storedTheme
        : getRandomMastheadVariant()

  return (
    <Suspense fallback={<HomepageIntro variant={mastheadVariant} />}>
      <HomePageContent mastheadVariant={mastheadVariant} />
    </Suspense>
  )
}

async function HomePageContent({ mastheadVariant }: { mastheadVariant: MastheadVariant }) {
  const payload = await getPayload({ config: configPromise })

  const [productsResult, categoriesResult, collectionsResult, instagramReelsGlobal] =
    await Promise.all([
      payload.find({
        collection: 'products',
        depth: 2,
        draft: false,
        limit: 48,
        overrideAccess: false,
        sort: '-createdAt',
        where: { _status: { equals: 'published' } },
      }),
      payload.find({
        collection: 'categories',
        depth: 0,
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
      getCachedGlobal('instagram-reels', 0).catch(() => null),
    ])

  const products = productsResult.docs as Product[]
  const latestProducts = products.slice(0, 8)
  const categories = categoriesResult.docs
    .map((category) => ({
      category,
      image: getProductMedia(products.find((product) => productHasCategory(product, category.id))),
    }))
    .filter((item): item is { category: Category; image: MediaType } => Boolean(item.image))
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
      <HomepageIntroFadeOut variant={mastheadVariant} />
      <HomepageScrollControl />
      <HomepageMasthead variant={mastheadVariant} />

      {latestProducts.length > 0 ? (
        <section id="latest-arrivals" className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-9 flex items-end justify-between gap-5 md:mb-12">
              <div>
                {/*<p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[#6d685f]">
                  Fresh from the studio
                </p>*/}
                <h2 className="font-dream-orphanage text-sm leading-none md:text-6xl">
                  Latest arrivals
                </h2>
              </div>
              <Link
                className="group hidden items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] transition-colors hover:border-[#24231f] sm:inline-flex"
                href="/shop?sort=-createdAt"
              >
                Shop all new in
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <HomepageProductReveal>
              {latestProducts.map((product) => (
                <HomepageProductCard key={product.id} product={product} />
              ))}
            </HomepageProductReveal>

            <Link
              className="mt-10 inline-flex items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] sm:hidden"
              href="/shop?sort=-createdAt"
            >
              Shop all new in
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
          className={`px-5 py-6 md:px-10 md:py-8 lg:px-14 ${
            mastheadVariant === 'red'
              ? 'bg-[linear-gradient(135deg,#f76b5e_0%,#e44042_52%,#ba2632_100%)] text-white'
              : mastheadVariant === 'blue'
                ? 'bg-[linear-gradient(135deg,#5b8ee9_0%,#3970cf_52%,#2452ab_100%)] text-white'
                : mastheadVariant === 'pink'
                  ? 'bg-[linear-gradient(135deg,#ffb2d6_0%,#f477af_52%,#c83d7a_100%)] text-white'
                  : mastheadVariant === 'navy'
                    ? 'bg-[linear-gradient(135deg,#6376bd_0%,#3d5193_52%,#263870_100%)] text-white'
                    : 'bg-[linear-gradient(135deg,#ed9478_0%,#c65b40_52%,#9f442f_100%)] text-white'
          }`}
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
                className="mt-5 max-w-sm text-sm leading-relaxed text-white md:mt-0"
                data-category-description
              >
                Everyday forms, expressive details, and silhouettes designed for repeat wear.
              </p>
            </div>

            <div
              className={
                categories.length === 1
                  ? 'flex justify-center'
                  : `mx-auto grid grid-cols-2 items-start justify-items-center gap-x-3 gap-y-8 ${
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
                  className={`group relative aspect-[2/3] w-full max-w-[20rem] overflow-hidden border-4 border-white bg-[#c9c2b6] ${
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white md:p-6">
                    <h3 className="font-dream-orphanage text-2xl leading-none md:text-3xl lg:text-4xl">
                      {category.title}
                    </h3>
                    <ArrowUpRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
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

      <InstagramReels urls={instagramReelUrls} variant={mastheadVariant} />

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
