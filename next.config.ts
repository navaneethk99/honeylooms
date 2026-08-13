import { withPayload } from '@payloadcms/next/withPayload'
import { withPostHogConfig } from '@posthog/nextjs-config'
import type { NextConfig } from 'next'
import path from 'path'
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const isProductionDeployment = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.CI === 'true' && process.env.NODE_ENV === 'production'
const uploadPostHogSourceMaps =
  isProductionDeployment && Boolean(process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID)

const imageRemoteURLs = [NEXT_PUBLIC_SERVER_URL, process.env.R2_PUBLIC_URL].filter(
  Boolean,
) as string[]

const imageRemotePatterns = imageRemoteURLs.map((item) => {
  const url = new URL(item)

  return {
    hostname: url.hostname,
    pathname: '/**',
    protocol: url.protocol.replace(':', '') as 'http' | 'https',
  }
})

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  experimental: {
    globalNotFound: true,
    proxyClientMaxBodySize: '110mb',
    turbopackFileSystemCacheForBuild: true,
  },

  serverExternalPackages: ['pdfkit'],

  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },

  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/inverted_honeylooms.png',
      },
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [90, 100],
    remotePatterns: [
      ...imageRemotePatterns,
      {
        hostname: '**.r2.dev',
        pathname: '/**',
        protocol: 'https',
      },
    ],
  },

  reactStrictMode: true,
  redirects,

  webpack: (webpackConfig) => {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '3dsvg$': path.resolve(process.cwd(), 'node_modules/3dsvg/dist/index.js'),
    }

    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPostHogConfig(withPayload(nextConfig), {
  host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com',
  personalApiKey: process.env.POSTHOG_API_KEY || '',
  projectId: process.env.POSTHOG_PROJECT_ID,
  sourcemaps: {
    deleteAfterUpload: true,
    enabled: uploadPostHogSourceMaps,
  },
})
