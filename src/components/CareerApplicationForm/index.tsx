'use client'

import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import React, { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ApplicationQuestion = {
  fieldType: 'shortText' | 'longText' | 'email' | 'phone' | 'url' | 'select'
  id: string
  options?: { label: string }[] | null
  placeholder?: string | null
  question: string
  required?: boolean | null
}

type Props = {
  jobId: number
  questions: ApplicationQuestion[]
  turnstileSiteKey: string
}

type TurnstileWidget = {
  remove: (widgetID: string) => void
  render: (
    container: HTMLElement,
    options: {
      callback: (token: string) => void
      'error-callback': () => void
      'expired-callback': () => void
      sitekey: string
    },
  ) => string
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

export function CareerApplicationForm({ jobId, questions, turnstileSiteKey }: Props) {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [website, setWebsite] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetID = useRef<string | null>(null)
  const isTurnstileConfigured = Boolean(turnstileSiteKey)

  const renderTurnstile = () => {
    if (!turnstileContainerRef.current || !window.turnstile || turnstileWidgetID.current) return

    turnstileWidgetID.current = window.turnstile.render(turnstileContainerRef.current, {
      callback: (token) => {
        setError('')
        setTurnstileToken(token)
      },
      'error-callback': () => {
        setError('Verification could not be loaded. Please refresh and try again.')
        setTurnstileToken('')
      },
      'expired-callback': () => setTurnstileToken(''),
      sitekey: turnstileSiteKey,
    })
  }

  useEffect(() => {
    return () => {
      if (turnstileWidgetID.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetID.current)
      }
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!turnstileToken) {
      setError('Please complete the verification before submitting your application.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/careers/apply', {
        body: JSON.stringify({ jobId, responses, turnstileToken, website }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send your application.')
      }

      setIsSuccess(true)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to send your application.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const setResponse = (questionID: string, answer: string) => {
    setResponses((current) => ({ ...current, [questionID]: answer }))
  }

  if (isSuccess) {
    return (
      <div className="border-y border-neutral-300 py-14 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-9 text-[#9b7012]" />
        <h2 className="font-editorial text-2xl">Application received.</h2>
        <p className="mt-3 text-sm text-neutral-600">
          Our team will review your response and contact you via email or mobile very soon!
        </p>
        <Link className="mt-6 inline-block text-sm underline underline-offset-4" href="/careers">
          Back to careers
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-6 min-w-[50vw]" onSubmit={handleSubmit}>
      {questions.map((question) => {
        const inputID = `career-question-${jobId}-${question.id}`
        const value = responses[question.id] || ''

        return (
          <div className="space-y-2" key={question.id}>
            <Label htmlFor={inputID}>
              {question.question}
              {question.required ? ' *' : ''}
            </Label>
            {question.fieldType === 'longText' ? (
              <Textarea
                className="min-h-32 rounded-none border-neutral-300 bg-white"
                id={inputID}
                maxLength={5000}
                onChange={(event) => setResponse(question.id, event.target.value)}
                placeholder={question.placeholder || undefined}
                required={Boolean(question.required)}
                value={value}
              />
            ) : question.fieldType === 'select' ? (
              <select
                className="flex h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                id={inputID}
                onChange={(event) => setResponse(question.id, event.target.value)}
                required={Boolean(question.required)}
                value={value}
              >
                <option value="">{question.placeholder || 'Select an option'}</option>
                {(question.options || []).map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                className="h-11 rounded-none border-neutral-300 bg-white"
                id={inputID}
                maxLength={500}
                onChange={(event) => setResponse(question.id, event.target.value)}
                placeholder={question.placeholder || undefined}
                required={Boolean(question.required)}
                type={
                  question.fieldType === 'phone'
                    ? 'tel'
                    : question.fieldType === 'shortText'
                      ? 'text'
                      : question.fieldType
                }
                value={value}
              />
            )}
          </div>
        )
      })}
      <div aria-hidden="true" className="hidden">
        <Label htmlFor={`career-website-${jobId}`}>Website</Label>
        <Input
          autoComplete="off"
          id={`career-website-${jobId}`}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          value={website}
        />
      </div>
      {isTurnstileConfigured ? (
        <>
          <div className="flex justify-center">
            <div ref={turnstileContainerRef} />
          </div>
          <Script
            id="cloudflare-turnstile"
            onReady={renderTurnstile}
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
          />
        </>
      ) : (
        <p className="text-center text-sm text-destructive" role="alert">
          Application verification is currently unavailable.
        </p>
      )}
      <Button
        className="h-auto w-full rounded-none bg-[#24231f] py-3.5 text-xs tracking-[0.16em] uppercase hover:bg-[#3b3932]"
        disabled={isSubmitting || !turnstileToken || !isTurnstileConfigured}
        type="submit"
      >
        {isSubmitting ? 'Sending application...' : 'Submit application'}
      </Button>
      {error && (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
