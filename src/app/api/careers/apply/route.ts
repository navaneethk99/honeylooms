import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeURL = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid application.' }, { status: 400 })
    }

    const jobID =
      typeof body.jobId === 'number' && Number.isInteger(body.jobId) && body.jobId > 0
        ? body.jobId
        : null

    // This honeypot is deliberately absent from the CMS schema.
    if (body.website) {
      return NextResponse.json({ success: true })
    }

    if (!jobID || !isRecord(body.responses)) {
      return NextResponse.json({ error: 'Invalid application.' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const jobs = await payload.find({
      collection: 'job-postings',
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        id: {
          equals: jobID,
        },
      },
    })
    const job = jobs.docs[0]

    if (!job) {
      return NextResponse.json(
        { error: 'This position is no longer accepting applications.' },
        { status: 410 },
      )
    }

    const hasClosed = job.closingDate
      ? new Date(job.closingDate).getTime() < new Date().setHours(0, 0, 0, 0)
      : false

    if (!job.active || hasClosed) {
      return NextResponse.json(
        { error: 'This position is no longer accepting applications.' },
        { status: 410 },
      )
    }

    let hasInvalidResponse = false
    const responses = (job.questions || []).map((question, index) => {
      const responseKey = question.id || String(index)
      const rawAnswer = body.responses[responseKey]
      let answer = typeof rawAnswer === 'string' ? rawAnswer.trim() : ''
      const maxLength = question.fieldType === 'longText' ? 5000 : 500

      if ((question.required && !answer) || answer.length > maxLength) {
        hasInvalidResponse = true
      }

      if (answer && question.fieldType === 'email' && !EMAIL_PATTERN.test(answer)) {
        hasInvalidResponse = true
      }

      if (answer && question.fieldType === 'url') {
        const normalizedURL = normalizeURL(answer)
        if (normalizedURL) {
          answer = normalizedURL
        } else {
          hasInvalidResponse = true
        }
      }

      if (answer && question.fieldType === 'select') {
        const allowedOptions = (question.options || []).map((option) => option.label)
        if (!allowedOptions.includes(answer)) {
          hasInvalidResponse = true
        }
      }

      return {
        answer,
        question: question.question,
      }
    })

    if (hasInvalidResponse) {
      return NextResponse.json(
        { error: 'Please check the information you entered and try again.' },
        { status: 400 },
      )
    }

    await payload.create({
      collection: 'career-applications',
      data: {
        job: job.id,
        responses,
        status: 'new',
      },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unable to create career application:', error)
    return NextResponse.json(
      { error: 'Unable to send your application. Please try again.' },
      { status: 500 },
    )
  }
}
