import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMock = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue(payloadMock) }))

import { addressBelongsToUser, sanitizeAddressInput } from '@/app/api/account-addresses/utilities'
import { GET, POST } from '@/app/api/account-addresses/route'
import { PATCH } from '@/app/api/account-addresses/[id]/route'
import type { Address } from '@/payload-types'

describe('storefront address isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMock.auth.mockResolvedValue({ user: { id: 42, roles: ['admin'] } })
  })

  it('matches addresses to the authenticated account regardless of role', () => {
    const address = { customer: 42 } as Address

    expect(addressBelongsToUser(address, 42)).toBe(true)
    expect(addressBelongsToUser(address, 99)).toBe(false)
  })

  it('prevents clients from assigning or reassigning address ownership', () => {
    expect(
      sanitizeAddressInput({
        addressLine1: 'Safe address',
        createdAt: 'forged',
        customer: 999,
        id: 123,
        updatedAt: 'forged',
      }),
    ).toEqual({
      addressLine1: 'Safe address',
    })
  })

  it('filters the storefront list to the signed-in admin account', async () => {
    payloadMock.find.mockResolvedValue({ docs: [] })

    const response = await GET(new Request('http://localhost/api/account-addresses'))

    expect(response.status).toBe(200)
    expect(payloadMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'addresses',
        where: { customer: { equals: 42 } },
      }),
    )
  })

  it('forces new storefront addresses onto the signed-in account', async () => {
    payloadMock.create.mockResolvedValue({ id: 1 })

    const response = await POST(
      new Request('http://localhost/api/account-addresses', {
        body: JSON.stringify({ country: 'IN', customer: 999, firstName: 'Admin' }),
        method: 'POST',
      }),
    )

    expect(response.status).toBe(201)
    expect(payloadMock.create).toHaveBeenCalledWith({
      collection: 'addresses',
      data: {
        country: 'IN',
        customer: 42,
        firstName: 'Admin',
      },
    })
  })

  it('does not let the storefront update another customer address', async () => {
    payloadMock.findByID.mockResolvedValue({ customer: 99, id: 7 })

    const response = await PATCH(
      new Request('http://localhost/api/account-addresses/7', {
        body: JSON.stringify({ firstName: 'Changed' }),
        method: 'PATCH',
      }),
      { params: Promise.resolve({ id: '7' }) },
    )

    expect(response.status).toBe(404)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })
})
