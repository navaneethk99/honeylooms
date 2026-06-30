import type { Metadata } from 'next'
import React from 'react'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function DisclaimerPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
        Disclaimer
      </h1>
      <div className="text-neutral-600 dark:text-neutral-400 space-y-4 text-sm leading-relaxed">
        <p>
          The information provided by Honeylooms (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) on this website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
        </p>
        <p>
          Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided on the site. Your use of the site and your reliance on any information on the site is solely at your own risk.
        </p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'View the legal disclaimer and terms of use information for Honeylooms.',
  openGraph: mergeOpenGraph({
    title: 'Disclaimer',
    url: '/disclaimer',
  }),
  title: 'Disclaimer',
}
