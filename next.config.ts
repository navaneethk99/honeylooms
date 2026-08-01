import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

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
  experimental: {
    proxyClientMaxBodySize: '110mb',
  },

  serverExternalPackages: ['pdfkit'],

  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },

  images: {
    unoptimized: false,
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
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig)
