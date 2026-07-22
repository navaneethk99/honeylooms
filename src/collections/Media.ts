import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'
import { convertImageUploadToWebP } from '@/hooks/convertImageUploadToWebP'
import { bannerImagePresets } from '@/utilities/bannerImagePresets'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  admin: {
    group: 'Content',
  },
  slug: 'media',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  hooks: {
    beforeOperation: [convertImageUploadToWebP],
  },
  upload: {
    imageSizes: bannerImagePresets.map(({ dimension, name, quality }) => ({
      name,
      width: dimension,
      height: dimension,
      fit: 'inside',
      withoutEnlargement: true,
      formatOptions: {
        format: 'webp',
        options: {
          quality,
        },
      },
    })),
    staticDir: path.resolve(dirname, '../../public/media'),
  },
}
