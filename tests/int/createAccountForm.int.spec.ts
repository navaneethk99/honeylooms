import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.hoisted(() => vi.fn())
const loginMock = vi.hoisted(() => vi.fn())
const pushMock = vi.hoisted(() => vi.fn())

vi.mock('@/providers/Auth', () => ({
  // Return a new callback to ensure ordinary re-renders cannot reset the polling timer.
  useAuth: () => ({
    login: (credentials: { email: string; password: string }) => loginMock(credentials),
  }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: () => null,
    toString: () => '',
  }),
}))

import { CreateAccountForm } from '@/components/forms/CreateAccountForm'

describe('CreateAccountForm verification polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock.mockReset()
    loginMock.mockReset()
    pushMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('continues polling while the resend countdown re-renders the form', async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          email: 'customer@example.com',
          verificationStatusToken: 'status-token',
        }),
      )
      .mockResolvedValue(Response.json({ verified: true }))
    loginMock.mockResolvedValue({ id: 1 })

    render(React.createElement(CreateAccountForm))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Customer' } })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'customer@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
      await Promise.resolve()
    })

    expect(screen.getByText('Verification code')).toBeTruthy()
    await act(() => vi.advanceTimersByTimeAsync(3000))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      action: 'status',
      token: 'status-token',
    })
    expect(loginMock).toHaveBeenCalledWith({
      email: 'customer@example.com',
      password: 'password',
    })
    expect(pushMock).toHaveBeenCalledWith('/account?success=Account%20created%20successfully')
  })
})
