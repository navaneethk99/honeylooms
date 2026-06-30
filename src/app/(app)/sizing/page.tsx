import type { Metadata } from 'next'
import React from 'react'
import { SizingClient } from './SizingClient'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function SizingPage() {
  return (
    <div className="w-full px-4 md:px-8 py-16 md:py-24">
      <SizingClient />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'View the sizing chart and find your perfect fit with our interactive CM/Inches converter.',
  openGraph: mergeOpenGraph({
    title: 'Size Guide',
    url: '/sizing',
  }),
  title: 'Size Guide',
}
