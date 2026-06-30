import type { Metadata } from 'next'
import Page, { metadata as originalMetadata } from '../deliveries-and-returns/page'

export default Page
export const metadata: Metadata = {
  ...originalMetadata,
  openGraph: {
    ...originalMetadata.openGraph,
    url: '/delivieries-and-returns',
  },
}
