import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { APIError } from 'payload'
import type { CollectionBeforeOperationHook, File as PayloadFile } from 'payload'
import sharp from 'sharp'

const WEBP_MIME_TYPE = 'image/webp'
const WEBP_QUALITY = 82

const getUploadBuffer = async (file: PayloadFile): Promise<Buffer> => {
  if (file.data.length > 0) return file.data
  if (file.tempFilePath) return readFile(file.tempFilePath)

  throw new APIError('The uploaded image is empty.', 400)
}

const getWebPFilename = (filename: string): string => {
  const parsedFilename = path.parse(filename)
  return `${parsedFilename.name || 'image'}.webp`
}

export const convertImageFileToWebP = async (file: PayloadFile): Promise<PayloadFile> => {
  if (!file.mimetype.toLowerCase().startsWith('image/')) return file

  try {
    const input = await getUploadBuffer(file)
    const metadata = await sharp(input, { animated: true, failOn: 'error' }).metadata()
    const data =
      metadata.format === 'webp'
        ? input
        : await sharp(input, { animated: true, failOn: 'error' })
            .rotate()
            .webp({ effort: 4, quality: WEBP_QUALITY })
            .toBuffer()

    if (file.tempFilePath) await writeFile(file.tempFilePath, data)

    return {
      ...file,
      data,
      mimetype: WEBP_MIME_TYPE,
      name: getWebPFilename(file.name),
      size: data.length,
    }
  } catch (error) {
    if (error instanceof APIError) throw error

    throw new APIError('The uploaded image format could not be converted to WebP.', 400)
  }
}

/** Convert the original upload before Payload generates sizes or hands files to R2. */
export const convertImageUploadToWebP: CollectionBeforeOperationHook = async ({
  operation,
  req,
}) => {
  if ((operation === 'create' || operation === 'update') && req.file) {
    req.file = await convertImageFileToWebP(req.file)
  }
}
