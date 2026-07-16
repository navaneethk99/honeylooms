import { NextRequest } from 'next/server'

const isInstagramUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.hostname === 'instagram.com' || url.hostname.endsWith('.instagram.com')
  } catch {
    return false
  }
}

const isInstagramImageUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.cdninstagram.com')
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const reelUrl = request.nextUrl.searchParams.get('url')

  if (!reelUrl || !isInstagramUrl(reelUrl)) {
    return new Response('Invalid Instagram URL.', { status: 400 })
  }

  try {
    const reelPage = await fetch(reelUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; Honeylooms/1.0)' },
      next: { revalidate: 3600 },
    })
    const html = await reelPage.text()
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    const imageUrl = imageMatch?.[1]?.replaceAll('&amp;', '&')

    if (!imageUrl || !isInstagramImageUrl(imageUrl)) {
      return new Response('Instagram preview unavailable.', { status: 404 })
    }

    const image = await fetch(imageUrl, { next: { revalidate: 3600 } })

    if (!image.ok || !image.body) {
      return new Response('Instagram preview unavailable.', { status: 502 })
    }

    return new Response(image.body, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': image.headers.get('content-type') ?? 'image/jpeg',
      },
    })
  } catch {
    return new Response('Instagram preview unavailable.', { status: 502 })
  }
}
