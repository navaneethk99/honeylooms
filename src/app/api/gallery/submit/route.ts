import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

const MAX_FILES = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_TOTAL_UPLOAD_SIZE = 100 * 1024 * 1024
const MAX_REQUEST_SIZE = 105 * 1024 * 1024

const isUploadedFile = (value: FormDataEntryValue): value is File =>
  typeof value !== 'string' &&
  typeof value.arrayBuffer === 'function' &&
  typeof value.size === 'number' &&
  value.size > 0

const getExtension = (filename: string) => {
  const extension = filename
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return extension || 'upload'
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length'))
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'The combined upload size must not exceed 100 MB.' },
        { status: 413 },
      )
    }

    const formData = await request.formData()
    const submittedBy = formData.get('name')?.toString().trim()
    const productIDs = [...new Set(formData.getAll('products').map((value) => value.toString()))]
    const uploadedValues = formData.getAll('files')
    const files = uploadedValues.filter(isUploadedFile)

    if (!submittedBy || submittedBy.length > 100 || productIDs.length === 0) {
      console.warn('Rejected gallery submission: missing name or product', {
        hasName: Boolean(submittedBy),
        hasProduct: productIDs.length > 0,
      })
      return NextResponse.json(
        { error: 'Please enter your name and select at least one item you purchased.' },
        { status: 400 },
      )
    }

    if (files.length === 0 || files.length > MAX_FILES) {
      console.warn('Rejected gallery submission: invalid file count', {
        acceptedFiles: files.length,
        receivedFiles: uploadedValues.length,
      })
      return NextResponse.json(
        { error: `Upload between 1 and ${MAX_FILES} images or videos.` },
        { status: 400 },
      )
    }

    if (files.some((file) => !/^(image|video)\//.test(file.type) || file.size > MAX_FILE_SIZE)) {
      console.warn('Rejected gallery submission: unsupported file', {
        files: files.map((file) => ({ size: file.size, type: file.type || 'unknown' })),
      })
      return NextResponse.json(
        { error: 'Files must be images or videos no larger than 50 MB each.' },
        { status: 400 },
      )
    }

    const totalFileSize = files.reduce((total, file) => total + file.size, 0)
    if (totalFileSize > MAX_TOTAL_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: 'The combined upload size must not exceed 100 MB.' },
        { status: 413 },
      )
    }

    const payload = await getPayload({ config: configPromise })
    const products = await payload.find({
      collection: 'products',
      depth: 0,
      limit: productIDs.length,
      overrideAccess: false,
      pagination: false,
      where: {
        id: {
          in: productIDs,
        },
      },
    })

    if (products.docs.length !== productIDs.length) {
      return NextResponse.json(
        { error: 'One or more selected items could not be found.' },
        { status: 400 },
      )
    }

    await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())

        await payload.create({
          collection: 'gallery',
          data: {
            alt: `${submittedBy}'s Honeylooms look`,
            products: products.docs.map((product) => product.id),
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
    return NextResponse.json(
      { error: 'Unable to upload your submission. Please try again.' },
      { status: 500 },
    )
  }
}
