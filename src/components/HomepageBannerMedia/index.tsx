import type { Media } from '@/payload-types'

import { getMediaUrl } from '@/utilities/getMediaUrl'

type Props = {
  desktopImage: Media
  mobileImage: Media
}

export function HomepageBannerMedia({ desktopImage, mobileImage }: Props) {
  const desktopSrc = getMediaUrl(desktopImage.url)
  const mobileSrc = getMediaUrl(mobileImage.url)

  if (!desktopSrc || !mobileSrc) return null

  return (
    <picture className="absolute inset-0 block">
      <source media="(max-width: 767px)" srcSet={mobileSrc} />
      {/* A native picture element ensures only the matching responsive banner is requested. */}
      <img
        alt={desktopImage.alt || mobileImage.alt || ''}
        className="home-hero-media size-full object-cover"
        decoding="async"
        fetchPriority="high"
        loading="eager"
        src={desktopSrc}
      />
    </picture>
  )
}

export function HomepageFallbackBanner() {
  return (
    <picture className="absolute inset-0 block">
      <source media="(max-width: 767px)" srcSet="/homepage-banner-fallback-mobile.svg" />
      <img
        alt=""
        aria-hidden="true"
        className="home-hero-media size-full object-cover"
        fetchPriority="high"
        src="/homepage-banner-fallback.svg"
      />
    </picture>
  )
}
