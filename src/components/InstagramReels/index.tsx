import { ArrowUpRight, Instagram } from 'lucide-react'

import { HomepageSectionReveal } from '@/components/HomepageSectionReveal'

type InstagramReelsProps = {
  urls: string[]
}

export const InstagramReels = ({ urls }: InstagramReelsProps) => {
  const reels = urls.slice(0, 4)

  if (reels.length === 0) return null

  return (
    <section className="bg-white px-5 py-16 text-[#24231f] md:px-10 md:py-24 lg:px-14">
      <HomepageSectionReveal motion="reels">
        <div className="mb-9 flex items-end justify-between gap-5 md:mb-12">
          <div data-reveal-heading>
            <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#6d685f]">
              <Instagram className="size-3.5" />
              @thehoneylooms
            </p>
            <h2 className="font-dream-orphanage text-4xl leading-none tracking-[-0.03em] md:text-6xl">
              From our Instagram
            </h2>
          </div>
          <a
            className="group hidden items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] transition-colors hover:border-[#24231f] sm:inline-flex"
            data-reveal-action
            href="https://www.instagram.com/thehoneylooms/"
            rel="noreferrer"
            target="_blank"
          >
            Follow along
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>

        <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {reels.map((reel, index) => (
            <a
              aria-label={`Watch Honeylooms reel ${index + 1} on Instagram`}
              className="group relative aspect-[2/3] min-w-[78vw] snap-center overflow-hidden bg-[#c9c2b6] sm:min-w-[45vw] md:min-w-0"
              data-reveal-card
              href={reel}
              key={`${reel}-${index}`}
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt={`Honeylooms community reel ${index + 1}`}
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                loading="lazy"
                src={`/api/instagram/reel-preview?url=${encodeURIComponent(reel)}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <span className="absolute bottom-4 right-4 flex size-9 items-center justify-center rounded-full border border-white/50 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-[#24231f]">
                <ArrowUpRight className="size-4" />
              </span>
            </a>
          ))}
        </div>

        <a
          className="mt-8 inline-flex items-center gap-2 border-b border-[#24231f]/40 pb-1 text-[10px] uppercase tracking-[0.18em] sm:hidden"
          href="https://www.instagram.com/thehoneylooms/"
          rel="noreferrer"
          target="_blank"
        >
          Follow along
          <ArrowUpRight className="size-3.5" />
        </a>
      </HomepageSectionReveal>
    </section>
  )
}
