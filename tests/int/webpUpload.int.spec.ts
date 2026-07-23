import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import type { File as PayloadFile } from 'payload'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'

import { convertImageFileToWebP } from '@/hooks/convertImageUploadToWebP'

const temporaryDirectories: string[] = []

const createFile = (data: Buffer, name: string, mimetype: string): PayloadFile => ({
  data,
  mimetype,
  name,
  size: data.length,
})

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('WebP upload conversion', () => {
  it.each([
    ['png', 'image/png'],
    ['jpeg', 'image/jpeg'],
  ] as const)('converts a %s upload and its metadata', async (format, mimetype) => {
    const source = await sharp({
      create: {
        background: { alpha: 0.5, b: 30, g: 20, r: 10 },
        channels: 4,
        height: 12,
        width: 16,
      },
    })
      [format]()
      .toBuffer()

    const converted = await convertImageFileToWebP(createFile(source, `sample.${format}`, mimetype))

    expect(converted.name).toBe('sample.webp')
    expect(converted.mimetype).toBe('image/webp')
    expect(converted.size).toBe(converted.data.length)
    expect((await sharp(converted.data).metadata()).format).toBe('webp')
  })

  it('rasterizes SVG uploads to WebP', async () => {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="red"/></svg>',
    )

    const converted = await convertImageFileToWebP(
      createFile(source, 'vector.logo.svg', 'image/svg+xml'),
    )

    expect(converted.name).toBe('vector.logo.webp')
    expect((await sharp(converted.data).metadata()).format).toBe('webp')
  })

  it('normalizes existing WebP metadata without recompressing it', async () => {
    const source = await sharp({
      create: {
        background: 'blue',
        channels: 3,
        height: 8,
        width: 8,
      },
    })
      .webp()
      .toBuffer()

    const converted = await convertImageFileToWebP(
      createFile(source, 'already-webp.jpeg', 'image/webp'),
    )

    expect(converted.name).toBe('already-webp.webp')
    expect(converted.data).toEqual(source)
  })

  it('leaves videos and other non-image uploads unchanged', async () => {
    const video = createFile(Buffer.from('video'), 'clip.mp4', 'video/mp4')

    expect(await convertImageFileToWebP(video)).toBe(video)
  })

  it('converts temp-file uploads in place', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'honeylooms-webp-'))
    temporaryDirectories.push(directory)
    const tempFilePath = path.join(directory, 'upload')
    const source = await sharp({
      create: {
        background: 'green',
        channels: 3,
        height: 8,
        width: 8,
      },
    })
      .png()
      .toBuffer()
    await writeFile(tempFilePath, source)

    const converted = await convertImageFileToWebP({
      ...createFile(Buffer.alloc(0), 'temp.png', 'image/png'),
      tempFilePath,
    })

    expect(converted.tempFilePath).toBe(tempFilePath)
    expect((await sharp(await readFile(tempFilePath)).metadata()).format).toBe('webp')
  })

  it('rejects declared images that cannot be converted', async () => {
    const invalidImage = createFile(Buffer.from('not an image'), 'broken.png', 'image/png')

    await expect(convertImageFileToWebP(invalidImage)).rejects.toMatchObject({
      message: 'The uploaded image format could not be converted to WebP.',
      status: 400,
    })
  })
})
