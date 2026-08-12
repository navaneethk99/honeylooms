import { ChevronDown } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import React from 'react'

import { RichText } from '@/components/RichText'
import { getJobSlug } from '@/utilities/getJobSlug'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const metadata: Metadata = {
  description:
    'Explore open positions at Honeylooms and help us shape thoughtful, contemporary Indian fashion.',
  openGraph: mergeOpenGraph({
    title: 'Careers',
    url: '/careers',
  }),
  title: 'Careers',
}

const employmentLabels: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

export default async function CareersPage() {
  await connection()
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'job-postings',
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: ['sortOrder', '-createdAt'],
    where: {
      active: {
        equals: true,
      },
    },
  })

  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const openPositions = docs.filter(
    (job) => !job.closingDate || new Date(job.closingDate).getTime() >= startOfToday,
  )

  return (
    <div className="bg-white text-neutral-900">
      <section className="container py-14 md:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-editorial tracking-tight md:text-4xl">Careers</h1>
          <p className="mt-4 text-sm leading-6 text-neutral-600 md:text-base font-editorial">
            Join Honeylooms and help us create thoughtful, contemporary Indian clothing.
          </p>
        </div>
      </section>

      <section className="container pb-16 md:pb-24">
        <h2 className="mb-5 text-xl font-editorial">Open positions</h2>

        {openPositions.length ? (
          <div className="divide-y divide-neutral-300 border-y border-neutral-300 font-editorial">
            {openPositions.map((job) => {
              const roleDetails = [
                job.department,
                job.location,
                job.employmentType
                  ? employmentLabels[job.employmentType] || job.employmentType
                  : null,
              ].filter(Boolean)
              return (
                <article key={job.id}>
                  <details className="group min-w-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 marker:hidden [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium md:text-xl">{job.title}</h3>
                        <p className="mt-2 text-sm text-neutral-600">{roleDetails.join(' · ')}</p>
                      </div>
                      <div className="flex shrink-0 items-stretch">
                        <Link
                          className="inline-flex h-10 items-center justify-center bg-[#24231f] px-6 text-xs tracking-[0.16em] text-white uppercase transition-colors hover:bg-[#3b3932]"
                          href={`/careers/apply/${getJobSlug(job)}`}
                        >
                          Apply now
                        </Link>
                        <span className="flex size-10 items-center justify-center border-l border-white/20 bg-[#24231f] text-white">
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                        </span>
                      </div>
                    </summary>
                    <div className="max-w-3xl pb-7">
                      <RichText
                        className="prose-sm prose-neutral"
                        data={job.description}
                        enableGutter={false}
                      />
                      {job.closingDate && (
                        <p className="mt-6 text-xs text-neutral-500">
                          Applications close{' '}
                          {new Intl.DateTimeFormat('en-IN', {
                            dateStyle: 'long',
                          }).format(new Date(job.closingDate))}
                        </p>
                      )}
                    </div>
                  </details>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="border border-neutral-300 px-6 py-12 text-center">
            <p className="text-lg font-medium">No open positions right now.</p>
            <p className="mt-2 text-sm text-neutral-600">Please check back for future openings.</p>
          </div>
        )}
      </section>
    </div>
  )
}
