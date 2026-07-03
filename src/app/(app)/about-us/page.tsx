import type { Metadata } from 'next'
import React from 'react'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Lanyard } from '@/components/Lanyard'

export default async function AboutUsPage() {
  return (
    <div className="container max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
        {/* Content Section */}
        <div className="max-w-xl py-16 md:py-24">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
            About Us
          </h1>
          <div className="text-neutral-600 dark:text-neutral-400 space-y-4 text-sm leading-relaxed">
            <p>
              Welcome to Honeylooms, founded by <strong>Aarna Kudeshia</strong>, where tradition
              meets contemporary design. We specialize in producing premium, handcrafted clothing
              and lifestyle textiles that celebrate the beauty of natural fibers.
            </p>

            <p>
              Our mission is to create timeless garments that feel as good as they look. Every piece
              we make is meticulously crafted to ensuring comfort, style, and long-lasting
              durability.
            </p>

            <p>
              By partnering with local artisans and using sustainable techniques, we hope to build a
              more conscious future for fashion. Thank you for being a part of our journey and
              supporting the beauty of slow, intentional craftsmanship.
            </p>
          </div>
        </div>

        {/* Lanyard Section */}
        <div className="flex justify-center items-start h-full pt-0">
          <Lanyard frontImage="/lanyard.PNG" backImage="/lanyard_back.svg" />
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description:
    'Learn about Honeylooms, our mission, sustainable hand-loomed apparel, and commitment to fine artisan craftsmanship.',
  openGraph: mergeOpenGraph({
    title: 'About Us',
    url: '/about-us',
  }),
  title: 'About Us',
}
