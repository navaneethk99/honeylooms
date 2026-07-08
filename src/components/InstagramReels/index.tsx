type InstagramReelsProps = {
  urls: string[]
}

const getInstagramEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url.trim())
    const isInstagramHost =
      parsedUrl.hostname === 'instagram.com' || parsedUrl.hostname.endsWith('.instagram.com')

    if (!isInstagramHost) {
      return null
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean)
    const contentTypeIndex = segments.findIndex((segment) => segment === 'reel')
    const contentType = segments[contentTypeIndex]
    const shortcode = segments[contentTypeIndex + 1]

    if (!contentType || !shortcode) {
      return null
    }

    return `https://www.instagram.com/${contentType}/${shortcode}/embed`
  } catch {
    return null
  }
}

export const InstagramReels = ({ urls }: InstagramReelsProps) => {
  const reels = urls
    .map((url) => ({
      embedUrl: getInstagramEmbedUrl(url),
      url,
    }))
    .filter((reel): reel is { embedUrl: string; url: string } => Boolean(reel.embedUrl))
    .slice(0, 4)

  if (reels.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4 py-16 md:py-15">
      <div className="mb-10 flex flex-col justify-between border-b border-neutral-100 pb-5 dark:border-neutral-900 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-3xl font-semibold uppercase tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
            From Instagram
          </h2>
        </div>
        <a
          href="https://www.instagram.com/thehoneylooms/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 font-mono text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 md:mt-0"
        >
          Follow @thehoneylooms &rarr;
        </a>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {reels.map((reel, index) => (
          <div key={`${reel.embedUrl}-${index}`} className="flex justify-center bg-background">
            <iframe
              src={reel.embedUrl}
              title={`Honeylooms Instagram reel ${index + 1}`}
              className="h-[580px] w-full max-w-[360px]"
              loading="lazy"
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
