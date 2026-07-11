import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

const MAX_FILES = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024

const isUploadedFile = (value: FormDataEntryValue): value is File =>
  typeof value !== 'string' &&
  typeof value.arrayBuffer === 'function' &&
  typeof value.size === 'number' &&
  value.size > 0

const getExtension = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return extension || 'upload'
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const submittedBy = formData.get('name')?.toString().trim()
    const productID = formData.get('product')?.toString()
    const files = formData.getAll('files').filter(isUploadedFile)

    if (!submittedBy || submittedBy.length > 100 || !productID) {
      return NextResponse.json({ error: 'Please enter your name and select the item you purchased.' }, { status: 400 })
    }

    if (files.length === 0 || files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload between 1 and ${MAX_FILES} images or videos.` }, { status: 400 })
    }

    if (files.some((file) => !/^(image|video)\//.test(file.type) || file.size > MAX_FILE_SIZE)) {
      return NextResponse.json(
        { error: 'Files must be images or videos no larger than 50 MB each.' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config: configPromise })
    const product = await payload.findByID({
      collection: 'products',
      id: productID,
      depth: 0,
      overrideAccess: false,
    })

    if (!product) {
      return NextResponse.json({ error: 'The selected item could not be found.' }, { status: 400 })
    }

    await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())

        await payload.create({
          collection: 'gallery',
          data: {
            alt: `${submittedBy}'s ${product.title || 'Honeylooms'} photo`,
            product: product.id,
            source: 'community',
            status: 'pending',
            submittedBy,
          },
          file: {
            data: buffer,
            mimetype: file.type,
            name: `${crypto.randomUUID()}.${getExtension(file.name)}`,
            size: file.size,
          },
          overrideAccess: true,
        })
      }),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unable to create gallery submission:', error)
    return NextResponse.json({ error: 'Unable to upload your submission. Please try again.' }, { status: 500 })
  }
}
