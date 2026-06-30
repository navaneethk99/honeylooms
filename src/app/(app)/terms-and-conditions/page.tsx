import type { Metadata } from 'next'
import React from 'react'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function TermsAndConditionsPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-16 md:py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
        Terms & Conditions
      </h1>
      <div className="text-neutral-600 dark:text-neutral-400 space-y-4 text-sm leading-relaxed">
        <p>
          Welcome to Honeylooms. These terms and conditions outline the rules and regulations for the use of Honeylooms&apos; Website. By accessing this website we assume you accept these terms and conditions. Do not continue to use Honeylooms if you do not agree to take all of the terms and conditions stated on this page.
        </p>
        <p>
          The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice: &ldquo;Client,&rdquo; &ldquo;You,&rdquo; and &ldquo;Your&rdquo; refers to you, the person log on this website and compliant to the Company&rsquo;s terms and conditions. &ldquo;The Company,&rdquo; &ldquo;Ourselves,&rdquo; &ldquo;We,&rdquo; &ldquo;Our,&rdquo; and &ldquo;Us&rdquo; refers to our Company.
        </p>
        <p>
          We employ the use of cookies. By accessing Honeylooms, you agreed to use cookies in agreement with the Honeylooms&apos; Privacy Policy. Most interactive websites use cookies to let us retrieve the user&apos;s details for each visit.
        </p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'View the terms and conditions governing the use of the Honeylooms website.',
  openGraph: mergeOpenGraph({
    title: 'Terms & Conditions',
    url: '/terms-and-conditions',
  }),
  title: 'Terms & Conditions',
}
