import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const getPayloadMock = vi.hoisted(() => vi.fn())

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('payload', () => ({
  APIError: class APIError extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
  getPayload: getPayloadMock,
}))

let POST: typeof import('@/app/api/account-verification/route').POST

const registrationRequest = (cookie?: string) =>
  new Request('http://localhost/api/account-verification', {
    body: JSON.stringify({
      action: 'register',
      email: 'victim@example.com',
      name: 'Attacker',
      password: 'attacker-password',
      passwordConfirm: 'attacker-password',
    }),
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    method: 'POST',
  })

const statusRequest = (token: string) =>
  new Request('http://localhost/api/account-verification', {
    body: JSON.stringify({ action: 'status', token }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

describe('account verification registration capability', () => {
  beforeAll(async () => {
    process.env.PAYLOAD_SECRET ||= 'account-verification-test-secret'
    ;({ POST } = await import('@/app/api/account-verification/route'))
  })

  beforeEach(() => {
    getPayloadMock.mockReset()
  })

  it('preserves expired credentials when the caller lacks the registration capability', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ name: 'Victim' }] })
    const payload = {
      db: { pool: { query } },
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: [
            {
              encryptedPassword: 'victim-encrypted-password',
              expiresAt: new Date(Date.now() - 60_000).toISOString(),
              name: 'Victim',
              otpAttempts: 0,
            },
          ],
        }),
      logger: { error: vi.fn() },
    }
    getPayloadMock.mockResolvedValue(payload)

    const response = await POST(registrationRequest())
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result).toEqual({
      email: 'victim@example.com',
      verificationStatusToken: expect.any(String),
    })
    expect(response.headers.get('set-cookie')).not.toBeNull()
    expect(query).toHaveBeenCalledTimes(2)
    for (const [statement] of query.mock.calls) {
      expect(statement).not.toContain('encrypted_password')
      expect(statement).not.toContain('name =')
    }
  })

  it('does not expose an existing user through registration or status responses', async () => {
    const existingUser = {
      createdAt: new Date(Date.now() - 60_000).toISOString(),
      email: 'victim@example.com',
    }
    const existingPayload = {
      find: vi.fn().mockResolvedValue({ docs: [existingUser] }),
      logger: { error: vi.fn() },
    }
    getPayloadMock.mockResolvedValue(existingPayload)

    const existingResponse = await POST(registrationRequest())
    const existingResult = await existingResponse.json()

    const newPayload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      logger: { error: vi.fn() },
    }
    getPayloadMock.mockResolvedValue(newPayload)

    const newResponse = await POST(registrationRequest())
    const newResult = await newResponse.json()

    expect(Object.keys(existingResult).sort()).toEqual(Object.keys(newResult).sort())
    expect(existingResult).toEqual({
      email: 'victim@example.com',
      verificationStatusToken: expect.any(String),
    })
    expect(existingResponse.headers.get('set-cookie')).toMatch(
      /^honeylooms_pending_registration=[^;]+; Max-Age=600; Path=\/; HttpOnly; SameSite=Strict/,
    )
    expect(newResponse.headers.get('set-cookie')).toMatch(
      /^honeylooms_pending_registration=[^;]+; Max-Age=600; Path=\/; HttpOnly; SameSite=Strict/,
    )

    existingPayload.find.mockImplementation(async ({ where }) => ({
      docs:
        new Date(existingUser.createdAt) > new Date(where.createdAt.greater_than)
          ? [existingUser]
          : [],
    }))
    getPayloadMock.mockResolvedValue(existingPayload)

    const statusResponse = await POST(statusRequest(existingResult.verificationStatusToken))

    await expect(statusResponse.json()).resolves.toEqual({ verified: false })
    expect(existingPayload.find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'users',
        where: {
          createdAt: { greater_than: expect.any(String) },
          email: { equals: 'victim@example.com' },
        },
      }),
    )
  })

  it('binds an authorized expired restart to the previously stored credentials', async () => {
    let pendingRegistration: Record<string, unknown> | undefined
    const payload = {
      create: vi.fn(async ({ data }) => {
        pendingRegistration = data
        return data
      }),
      db: { pool: { query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }) } },
      find: vi.fn().mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] }),
      logger: { error: vi.fn() },
    }
    getPayloadMock.mockResolvedValue(payload)

    const initialResponse = await POST(registrationRequest())
    const capabilityCookie = initialResponse.headers.get('set-cookie')?.split(';')[0]
    expect(capabilityCookie).toBeDefined()
    expect(pendingRegistration).toBeDefined()

    payload.find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({
      docs: [
        {
          ...pendingRegistration,
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        },
      ],
    })

    const response = await POST(registrationRequest(capabilityCookie))

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).not.toBeNull()
    expect(payload.db.pool.query).toHaveBeenCalledTimes(1)
    const [statement, values] = payload.db.pool.query.mock.calls[0]
    expect(statement).toContain('AND encrypted_password = $7')
    expect(values[6]).toBe(pendingRegistration?.encryptedPassword)
  })
})
