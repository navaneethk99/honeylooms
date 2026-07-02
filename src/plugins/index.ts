import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { applyCosmeticCurrencyAdminOverrides } from '@/utilities/adminCurrencyOverrides'
import { cashfreeAdapter } from '@/payments/cashfree/server'
import { codAdapter } from '@/payments/cod/server'
import { reduceInventory } from '@/hooks/reduceInventory'
import { sendInvoiceEmail } from '@/hooks/sendInvoiceEmail'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Honeylooms` : 'Honeylooms'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const r2PublicURL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
const r2Endpoint = process.env.R2_ENDPOINT ? new URL(process.env.R2_ENDPOINT).origin : undefined

export const plugins: Plugin[] = [
  s3Storage({
    enabled: Boolean(
      process.env.R2_BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      r2Endpoint &&
      r2PublicURL,
    ),
    collections: {
      media: {
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) => {
          const key = prefix ? `${prefix}/${filename}` : filename

          return `${r2PublicURL}/${key}`
        },
      },
    },
    bucket: process.env.R2_BUCKET || '',
    config: {
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      endpoint: r2Endpoint,
      forcePathStyle: true,
      region: 'auto',
    },
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: {
          ...defaultCollection.admin,
          defaultColumns: ['id', 'createdAt', 'paymentMethod', 'amount', 'status'],
        },
        hooks: {
          ...defaultCollection?.hooks,
          afterChange: [
            ...(defaultCollection?.hooks?.afterChange || []),
            reduceInventory,
            sendInvoiceEmail,
          ],
        },
        fields: applyCosmeticCurrencyAdminOverrides([
          ...defaultCollection.fields.map((field) => {
            if ('name' in field && field.name === 'status' && field.type === 'select') {
              return {
                ...field,
                options: [
                  { label: 'Processing', value: 'processing' },
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Shipped', value: 'shipped' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' },
                  { label: 'Refunded', value: 'refunded' },
                ],
              }
            }
            return field
          }),
          {
            name: 'paymentMethod',
            type: 'select',
            options: [
              { label: 'UPI', value: 'cashfree' },
              { label: 'Cash on Delivery', value: 'cod' },
            ],
            defaultValue: 'cashfree',
            admin: {
              position: 'sidebar',
            },
          },
          {
            name: 'shippingLink',
            type: 'text',
            label: 'Shipping Tracking Link',
            admin: {
              position: 'sidebar',
              condition: (data) => data?.status === 'shipped',
            },
          },
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }: any) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
          {
            name: 'cashfreeOrderID',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
        ]),
      }),
    },
    payments: {
      paymentMethods: [
        cashfreeAdapter({
          apiVersion: process.env.CASHFREE_API_VERSION,
          appID: process.env.CASHFREE_APP_ID!,
          environment: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
          label: 'UPI',
          paymentMethods: 'upi',
          secretKey: process.env.CASHFREE_SECRET_KEY!,
        }),
        codAdapter({}),
      ],
    },
    products: {
      variants: {
        variantsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          hooks: {
            ...defaultCollection?.hooks,
            afterChange: [
              ...(defaultCollection?.hooks?.afterChange || []),
              async ({ doc, req: { context, payload } }) => {
                if (context.disableRevalidate || !doc.product) {
                  return doc
                }
                try {
                  const productID = typeof doc.product === 'object' ? doc.product.id : doc.product
                  const product = await payload.findByID({
                    collection: 'products',
                    id: productID,
                    depth: 0,
                  })
                  if (product && product.slug) {
                    const { revalidateTag, revalidatePath } = require('next/cache')
                    payload.logger.info(`Revalidating product cache from variant: ${product.slug}`)
                    revalidateTag('products', 'max')
                    revalidatePath(`/products/${product.slug}`)
                    revalidatePath('/shop')
                  }
                } catch (err) {
                  payload.logger.error(`Error revalidating product cache from variant: ${err}`)
                }
                return doc
              },
            ],
            afterDelete: [
              ...(defaultCollection?.hooks?.afterDelete || []),
              async ({ doc, req: { context, payload } }) => {
                if (context.disableRevalidate || !doc.product) {
                  return doc
                }
                try {
                  const productID = typeof doc.product === 'object' ? doc.product.id : doc.product
                  const product = await payload.findByID({
                    collection: 'products',
                    id: productID,
                    depth: 0,
                  })
                  if (product && product.slug) {
                    const { revalidateTag, revalidatePath } = require('next/cache')
                    payload.logger.info(`Revalidating product cache from deleted variant: ${product.slug}`)
                    revalidateTag('products', 'max')
                    revalidatePath(`/products/${product.slug}`)
                    revalidatePath('/shop')
                  }
                } catch (err) {
                  payload.logger.error(`Error revalidating product cache from deleted variant: ${err}`)
                }
                return doc
              },
            ],
          },
          fields: applyCosmeticCurrencyAdminOverrides(defaultCollection.fields),
        }),
      },
      productsCollectionOverride: ProductsCollection,
    },
    carts: {
      cartsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: applyCosmeticCurrencyAdminOverrides(defaultCollection.fields),
      }),
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: applyCosmeticCurrencyAdminOverrides(defaultCollection.fields),
      }),
    },
  }),
]
