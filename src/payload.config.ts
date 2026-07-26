import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { CareerApplications } from '@/collections/CareerApplications'
import { Collections } from '@/collections/Collections'
import { Gallery } from '@/collections/Gallery'
import { HomepageBanners } from '@/collections/HomepageBanners'
import { JobPostings } from '@/collections/JobPostings'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { PromoCodes } from '@/collections/PromoCodes'
import { Refunds } from '@/collections/Refunds'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { FeaturedOutfits } from '@/globals/FeaturedOutfits'
import { InstagramReels } from '@/globals/InstagramReels'
import { PromoBanner } from '@/globals/PromoBanner'
import { getDatabaseURL } from '@/utilities/getDatabaseURL'
import { plugins } from './plugins'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      graphics: {
        Logo: '@/components/Logo/Logo#Logo',
      },
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    meta: {
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
      title: 'ADMIN - HONEYLOOMS',
      titleSuffix: '',
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Pages,
    Categories,
    Media,
    Collections,
    HomepageBanners,
    Gallery,
    PromoCodes,
    Refunds,
    JobPostings,
    CareerApplications,
  ],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, 'migrations'),
    pool: {
      connectionString: getDatabaseURL(process.env.DATABASE_URL),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    // Builds read CMS data while prerendering, but must not mutate the database.
    prodMigrations: process.env.PAYLOAD_SKIP_PROD_MIGRATIONS === 'true' ? undefined : migrations,
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  ...(process.env.SMTP_HOST
    ? (() => {
        const port = Number(process.env.SMTP_PORT) || 587
        return {
          email: nodemailerAdapter({
            defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'contact@honeylooms.in',
            defaultFromName: process.env.SMTP_FROM_NAME || 'Honeylooms',
            transportOptions: {
              host: process.env.SMTP_HOST,
              port,
              secure: port === 465,
              auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
              },
            },
          }),
        }
      })()
    : {}),
  endpoints: [],
  globals: [Header, Footer, FeaturedOutfits, InstagramReels, PromoBanner],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
