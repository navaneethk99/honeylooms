'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  name: string
  password: string
  passwordConfirm: string
  otp: string
}

const INVALID_OTP_ERROR = 'That verification code is invalid or has expired.'
const RESEND_COOLDOWN_MS = 60 * 1000

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const verificationToken = searchParams.get('verification') || ''
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [success, setSuccess] = useState<null | string>(null)
  const [step, setStep] = useState<'account' | 'link' | 'verification'>(() =>
    verificationToken ? 'link' : 'account',
  )
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''))
  const [resendAvailableAt, setResendAvailableAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationStatusToken, setVerificationStatusToken] = useState('')
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const verificationInProgressRef = useRef(false)

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')
  const isInvalidOTPError = error === INVALID_OTP_ERROR
  const resendSecondsRemaining = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))

  useEffect(() => {
    if (!resendSecondsRemaining) return

    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [resendSecondsRemaining])

  const onSubmit = useCallback(
    async (data: FormData) => {
      setError(null)
      setSuccess(null)
      setLoading(true)
      verificationInProgressRef.current = true
      try {
        const response = await fetch('/api/account-verification', {
          body: JSON.stringify(
            step === 'link'
              ? { action: 'verify-link', token: verificationToken }
              : step === 'account'
                ? {
                    action: 'register',
                    email: data.email,
                    name: data.name,
                    password: data.password,
                    passwordConfirm: data.passwordConfirm,
                  }
                : { action: 'verify', email: verificationEmail, otp: data.otp },
          ),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message)

        if (step === 'account') {
          setVerificationEmail(result.email)
          setVerificationStatusToken(result.verificationStatusToken || '')
          setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS)
          setStep('verification')
          return
        }

        if (step === 'link') {
          const loginParams = new URLSearchParams({
            email: result.email,
            success: 'Email verified. Log in to continue.',
          })
          const redirect = searchParams.get('redirect')
          if (redirect) loginParams.set('redirect', redirect)
          router.push(`/login?${loginParams.toString()}`)
          return
        }

        await login({ email: verificationEmail, password: data.password })
        const redirect = searchParams.get('redirect')
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'There was an error creating the account. Please try again.',
        )
      } finally {
        verificationInProgressRef.current = false
        setLoading(false)
      }
    },
    [login, router, searchParams, step, verificationEmail, verificationToken],
  )

  const checkVerificationStatus = useEffectEvent(async (isCancelled: () => boolean) => {
    if (verificationInProgressRef.current) return false

    try {
      const response = await fetch('/api/account-verification', {
        body: JSON.stringify({ action: 'status', token: verificationStatusToken }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok || isCancelled()) return false

      const result = await response.json()
      if (!result.verified || isCancelled()) return false

      verificationInProgressRef.current = true
      setLoading(true)
      try {
        await login({ email: verificationEmail, password: getValues('password') })
        const redirect = searchParams.get('redirect')
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch {
        const loginParams = new URLSearchParams({
          email: verificationEmail,
          success: 'Email verified. Log in to continue.',
        })
        const redirect = searchParams.get('redirect')
        if (redirect) loginParams.set('redirect', redirect)
        router.push(`/login?${loginParams.toString()}`)
      }
      return true
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (step !== 'verification' || !verificationEmail || !verificationStatusToken) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      const complete = await checkVerificationStatus(() => cancelled)
      if (!cancelled && !complete) timer = setTimeout(poll, 2500)
    }

    timer = setTimeout(poll, 2500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [step, verificationEmail, verificationStatusToken])

  const resendCode = useCallback(async () => {
    if (resendSecondsRemaining) return

    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const response = await fetch('/api/account-verification', {
        body: JSON.stringify({ action: 'resend', email: verificationEmail }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      setSuccess('A new verification code has been sent.')
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to resend the verification code.',
      )
    } finally {
      setLoading(false)
    }
  }, [resendSecondsRemaining, verificationEmail])

  const updateOTP = (digits: string[]) => {
    setOtpDigits(digits)
    setValue('otp', digits.join(''), { shouldValidate: true })
  }

  const handleOTPChange = (index: number, value: string) => {
    const enteredDigits = value
      .replace(/\D/g, '')
      .slice(0, 6 - index)
      .split('')
    const nextDigits = [...otpDigits]

    if (enteredDigits.length > 1) {
      enteredDigits.forEach((digit, offset) => {
        nextDigits[index + offset] = digit
      })
      updateOTP(nextDigits)
      otpInputRefs.current[Math.min(index + enteredDigits.length, 5)]?.focus()
      return
    }

    nextDigits[index] = enteredDigits[0] || ''
    updateOTP(nextDigits)
    if (enteredDigits[0] && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  const handleOTPKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {isInvalidOTPError ? (
        <div
          className="mb-6 flex items-center gap-2 border-y border-[#24231f] bg-[#24231f] px-4 py-3 text-sm text-white"
          role="status"
        >
          <Info aria-hidden="true" className="size-4 shrink-0 text-white/70" />
          <p className="font-medium tracking-[0.01em]">{error}</p>
        </div>
      ) : (
        <Message className="mb-6 mt-0" error={error} success={success} />
      )}
      <div className="flex flex-col gap-5">
        {step === 'account' ? (
          <>
            <FormItem>
              <Label className="text-sm text-[#5d594f]" htmlFor="name">
                Name
              </Label>
              <Input
                autoComplete="name"
                className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
                id="name"
                {...register('name', { required: 'Name is required.' })}
              />
              {errors.name && <FormError message={errors.name.message} />}
            </FormItem>
            <FormItem>
              <Label className="text-sm text-[#5d594f]" htmlFor="email">
                Email
              </Label>
              <Input
                autoComplete="email"
                className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
                id="email"
                {...register('email', { required: 'Email is required.' })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>
            <FormItem>
              <Label className="text-sm text-[#5d594f]" htmlFor="password">
                Password
              </Label>
              <Input
                autoComplete="new-password"
                className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
                id="password"
                {...register('password', { required: 'Password is required.' })}
                type="password"
              />
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>
            <FormItem>
              <Label className="text-sm text-[#5d594f]" htmlFor="passwordConfirm">
                Confirm password
              </Label>
              <Input
                autoComplete="new-password"
                className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
                id="passwordConfirm"
                {...register('passwordConfirm', {
                  required: 'Please confirm your password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
            </FormItem>
          </>
        ) : step === 'verification' ? (
          <FormItem>
            <Label className="text-sm text-[#5d594f]" htmlFor="otp">
              Verification code
            </Label>
            <p className="mb-2 text-sm text-[#6c675d]">
              Enter the six-digit code sent to {verificationEmail}.
            </p>
            <p className="mb-3 text-sm text-[#6c675d]">
              Keep this page open to be signed in automatically if you verify on another device.
            </p>
            <input
              type="hidden"
              {...register('otp', {
                required: 'Enter the verification code.',
                pattern: { value: /^\d{6}$/, message: 'Enter the six-digit verification code.' },
              })}
            />
            <div className="grid grid-cols-6 gap-2" id="otp">
              {otpDigits.map((digit, index) => (
                <Input
                  aria-label={`Verification code digit ${index + 1}`}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  className="h-12 rounded-none border-[#24231f]/25 bg-transparent p-0 text-center text-lg text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
                  inputMode="numeric"
                  key={index}
                  maxLength={6 - index}
                  onChange={(event) => handleOTPChange(index, event.target.value)}
                  onKeyDown={(event) => handleOTPKeyDown(index, event)}
                  ref={(element) => {
                    otpInputRefs.current[index] = element
                  }}
                  type="text"
                  value={digit}
                />
              ))}
            </div>
            {errors.otp && <FormError message={errors.otp.message} />}
          </FormItem>
        ) : (
          <div className="border-y border-[#24231f]/20 py-6">
            <p className="font-medium tracking-[0.01em] text-[#24231f]">
              Confirm your email address
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6c675d]">
              Select the button below to verify your email and finish creating your Honeylooms
              account.
            </p>
          </div>
        )}
      </div>

      <div className="mt-7">
        <Button
          className="h-11 w-full rounded-none bg-[#24231f] text-sm text-white shadow-none hover:bg-[#3b3933]"
          disabled={loading}
          type="submit"
          variant="default"
        >
          {loading
            ? 'Processing'
            : step === 'account'
              ? 'Create account'
              : step === 'link'
                ? 'Confirm email'
                : 'Verify email'}
        </Button>
        {step === 'verification' ? (
          <button
            className="mt-5 text-sm text-[#24231f] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || resendSecondsRemaining > 0}
            onClick={resendCode}
            type="button"
          >
            {resendSecondsRemaining
              ? `Resend verification code in ${resendSecondsRemaining}s`
              : 'Resend verification code'}
          </button>
        ) : (
          <p className="mt-5 text-sm text-[#6c675d]">
            Already have an account?{' '}
            <Link
              className="text-[#24231f] underline underline-offset-4"
              href={`/login${allParams}`}
            >
              Log in
            </Link>
          </p>
        )}
      </div>
    </form>
  )
}
