import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import sharp from 'sharp'

import { bannerImagePresets } from '@/utilities/bannerImagePresets'

const CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable'

const getCachedPreview = unstable_cache(
  async (sourceUrl: string, _version: string, dimension: number, quality: number) => {
    const source = await fetch(sourceUrl)

    if (!source.ok) {
      throw new Error(`Unable to fetch source image: ${source.status}`)
    }

    const sourceBuffer = Buffer.from(await source.arrayBuffer())
    const preview = await sharp(sourceBuffer)
      .resize({ fit: 'inside', height: dimension, width: dimension, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()

    return preview.toString('base64')
  },
  ['homepage-banner-preview-v2'],
  { revalidate: false },
)

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const presetName = new URL(request.url).searchParams.get('size')
  const preset = bannerImagePresets.find(({ name }) => name === presetName)

  if (!/^\d+$/.test(id) || !preset) {
    return new Response('Invalid banner preview request.', { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const media = await payload.findByID({
      collection: 'media',
      id,
      depth: 0,
      disableErrors: true,
      overrideAccess: false,
    })

    if (!media?.url || !media.mimeType?.startsWith('image/')) {
      return new Response('Image not found.', { status: 404 })
    }

    const preview = Buffer.from(
      await getCachedPreview(media.url, media.updatedAt, preset.dimension, preset.quality),
      'base64',
    )

    return new Response(new Uint8Array(preview), {
      headers: {
        'Cache-Control': CACHE_CONTROL,
        'Content-Type': 'image/webp',
      },
    })
  } catch (error) {
    console.error(`Unable to generate banner preview for media ${id}:`, error)
    return new Response('Image unavailable.', { status: 502 })
  }
}
