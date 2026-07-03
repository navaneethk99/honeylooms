import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'
import { applyCosmeticCurrencyAdminOverrides } from '@/utilities/adminCurrencyOverrides'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInUSD: true,
    inventory: true,
    meta: true,
    onSale: true,
    salePrice: true,
    discountPercentage: true,
  },
  fields: applyCosmeticCurrencyAdminOverrides([
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  dbName: 'varOpt',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data: any) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }: { data?: any }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                } as any,
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'onSale',
              type: 'checkbox',
              label: 'On Sale',
              defaultValue: false,
            },
            {
              name: 'salePrice',
              type: 'number',
              label: 'Sale Price',
              admin: {
                condition: (data) => Boolean(data?.onSale),
              },
            },
            {
              name: 'discountPercentage',
              type: 'number',
              label: 'Discount Percentage (%)',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'discountPreview',
              type: 'ui',
              admin: {
                condition: (data) => Boolean(data?.onSale),
                components: {
                  Field:
                    '@/components/admin/DiscountPreviewField#DiscountPreviewField',
                },
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }: { id?: string | number }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'collections',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'collections',
    },
    slugField(),
  ]),
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange || []),
      ({ data, originalDoc, req }) => {
        const priceInUSD = data.priceInUSD !== undefined ? data.priceInUSD : originalDoc?.priceInUSD
        const salePrice = data.salePrice !== undefined ? data.salePrice : originalDoc?.salePrice
        const onSale = data.onSale !== undefined ? data.onSale : originalDoc?.onSale

        req.payload.logger.info(`sale check: onSale=${onSale}, priceInUSD=${priceInUSD} (${typeof priceInUSD}), salePrice=${salePrice} (${typeof salePrice})`)

        if (onSale && priceInUSD && salePrice) {
          const original = Number(priceInUSD)
          const sale = Number(salePrice)
          req.payload.logger.info(`sale math: original=${original}, sale=${sale}`)
          if (original > sale && original > 0) {
            data.discountPercentage = Math.round(((original - sale) / original) * 100)
            req.payload.logger.info(`sale percentage calculated: ${data.discountPercentage}`)
          } else {
            data.discountPercentage = 0
          }
        } else {
          data.discountPercentage = 0
        }
        return data
      },
    ],
    afterChange: [
      ...(defaultCollection?.hooks?.afterChange || []),
      ({ doc, req: { context, payload } }) => {
        if (context.disableRevalidate || !doc.slug) {
          return doc
        }

        const { revalidateTag, revalidatePath } = require('next/cache')
        payload.logger.info(`Revalidating product cache: ${doc.slug}`)
        revalidateTag('products', 'max')
        revalidatePath(`/products/${doc.slug}`)
        revalidatePath('/shop')
        return doc
      },
    ],
    afterDelete: [
      ...(defaultCollection?.hooks?.afterDelete || []),
      ({ doc, req: { context, payload } }) => {
        if (context.disableRevalidate || !doc?.slug) {
          return doc
        }

        const { revalidateTag, revalidatePath } = require('next/cache')
        payload.logger.info(`Revalidating deleted product cache: ${doc?.slug}`)
        revalidateTag('products', 'max')
        revalidatePath(`/products/${doc.slug}`)
        revalidatePath('/shop')
        return doc
      },
    ],
  },
})
