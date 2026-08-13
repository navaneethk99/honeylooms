import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { sanitizeAddressInput } from './utilities'

const unauthorized = () => Response.json({ error: 'Authentication required.' }, { status: 401 })

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return unauthorized()

  const result = await payload.find({
    collection: 'addresses',
    depth: 0,
    limit: 0,
    pagination: false,
    where: {
      customer: {
        equals: user.id,
      },
    },
  })

  return Response.json(result)
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return unauthorized()

  const body = sanitizeAddressInput((await request.json()) as Record<string, unknown>)

  if (!body.country) {
    return Response.json({ error: 'Country is required.' }, { status: 400 })
  }

  const address = await payload.create({
    collection: 'addresses',
    data: {
      ...body,
      country: body.country,
      customer: user.id,
    },
  })

  return Response.json({ doc: address }, { status: 201 })
}
