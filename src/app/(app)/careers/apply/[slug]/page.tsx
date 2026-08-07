import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { type ApplicationQuestion, CareerApplicationForm } from '@/components/CareerApplicationForm'
import { RichText } from '@/components/RichText'
import { getJobSlug } from '@/utilities/getJobSlug'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Apply',
}

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function CareerApplicationPage({ params }: Props) {
  const { slug } = await params

  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'job-postings',
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      description: true,
      questions: true,
      slug: true,
      title: true,
    },
  })
  const job = docs.find((position) => getJobSlug(position) === slug)

  if (!job) {
    notFound()
  }

  const questions: ApplicationQuestion[] = (job.questions || []).map((question, index) => ({
    fieldType: question.fieldType,
    id: question.id || String(index),
    options: question.options,
    placeholder: question.placeholder,
    question: question.question,
    required: question.required,
  }))

  return (
    <div className="bg-white text-neutral-900">
      <div className="container max-w-3xl py-12 md:py-20">
        <Link
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
          href="/careers"
        >
          <ArrowLeft className="size-4" />
          Back to careers
        </Link>

        <header className="mt-10 border-b border-neutral-300 pb-7 font-editorial">
          <p className="text-sm text-neutral-600">Apply for</p>
          <h1 className="mt-2 text-3xl tracking-tight md:text-4xl">{job.title}</h1>
          <RichText
            className="prose-sm prose-neutral mt-6 font-sans"
            data={job.description}
            enableGutter={false}
          />
        </header>

        <div className="py-8 flex justify-center items-center">
          <CareerApplicationForm
            jobId={job.id}
            questions={questions}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
          />
        </div>
      </div>
    </div>
  )
}
