'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
  passwordConfirm: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch('/api/users', {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = response.statusText || 'There was an error creating the account.'
        setError(message)
        return
      }

      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login(data)
        clearTimeout(timer)
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (_) {
        clearTimeout(timer)
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Message className="mb-6 mt-0" error={error} />
      <div className="flex flex-col gap-5">
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
      </div>

      <div className="mt-7">
        <Button
          className="h-11 w-full rounded-none bg-[#24231f] text-sm text-[#f5f1e8] shadow-none hover:bg-[#3b3933]"
          disabled={loading}
          type="submit"
          variant="default"
        >
          {loading ? 'Processing' : 'Create account'}
        </Button>
        <p className="mt-5 text-sm text-[#6c675d]">
          Already have an account?{' '}
          <Link className="text-[#24231f] underline underline-offset-4" href={`/login${allParams}`}>
            Log in
          </Link>
        </p>
      </div>
    </form>
  )
}
