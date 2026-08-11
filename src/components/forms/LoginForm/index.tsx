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
import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams()
  const createAccountSearchParams = new URLSearchParams(searchParams.toString())
  createAccountSearchParams.delete('warning')
  const createAccountParams = createAccountSearchParams.toString()
  const createAccountHref = `/create-account${createAccountParams ? `?${createAccountParams}` : ''}`
  const redirect = useRef(searchParams.get('redirect'))
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<null | React.ReactNode>(null)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login(data)
        if (redirect?.current) router.push(redirect.current)
        else router.push('/account')
      } catch (_) {
        setError(
          <>
            We couldn&apos;t log you in with these credentials. If you don&apos;t have an account,
            please{' '}
            <Link className="underline underline-offset-4" href={createAccountHref}>
              create an account
            </Link>{' '}
            to continue.
          </>,
        )
      }
    },
    [createAccountHref, login, router],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Message className="mb-6 mt-0 rounded-none text-sm" error={error} />
      <div className="flex flex-col gap-5">
        <FormItem>
          <Label className="text-sm text-[#5d594f]" htmlFor="email">
            Email
          </Label>
          <Input
            autoComplete="email"
            className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
            id="email"
            type="email"
            {...register('email', { required: 'Email is required.' })}
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <Label className="text-sm text-[#5d594f]" htmlFor="password">
            Password
          </Label>
          <Input
            autoComplete="current-password"
            className="h-11 rounded-none border-[#24231f]/25 bg-transparent px-3 text-[#24231f] shadow-none focus-visible:border-[#24231f] focus-visible:ring-0"
            id="password"
            type="password"
            {...register('password', { required: 'Please provide a password.' })}
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>
      </div>

      <div className="mt-7">
        <Button
          className="h-11 w-full rounded-none bg-[#24231f] text-sm text-white shadow-none hover:bg-[#3b3933]"
          disabled={isLoading}
          size="lg"
          type="submit"
          variant="default"
        >
          {isLoading ? 'Processing' : 'Continue'}
        </Button>
        <p className="mt-5 text-sm text-[#6c675d]">
          Don&apos;t have an account?{' '}
          <Link className="text-[#24231f] underline underline-offset-4" href={createAccountHref}>
            Create an account
          </Link>
        </p>
      </div>
    </form>
  )
}
