import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { addressBelongsToUser, sanitizeAddressInput } from '../utilities'

type RouteContext = { params: Promise<{ id: string }> }

const unauthorized = () => Response.json({ error: 'Authentication required.' }, { status: 401 })

export async function PATCH(request: Request, { params }: RouteContext) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return unauthorized()

  const { id } = await params
  const existing = await payload.findByID({
    collection: 'addresses',
    depth: 0,
    disableErrors: true,
    id,
  })

  if (!existing || !addressBelongsToUser(existing, user.id)) {
    return Response.json({ error: 'Address not found.' }, { status: 404 })
  }

  const body = sanitizeAddressInput((await request.json()) as Record<string, unknown>)
  const address = await payload.update({
    collection: 'addresses',
    data: body,
    id,
  })

  return Response.json({ doc: address })
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) return unauthorized()

  const { id } = await params
  const existing = await payload.findByID({
    collection: 'addresses',
    depth: 0,
    disableErrors: true,
    id,
  })

  if (!existing || !addressBelongsToUser(existing, user.id)) {
    return Response.json({ error: 'Address not found.' }, { status: 404 })
  }

  await payload.delete({
    collection: 'addresses',
    id,
  })

  return Response.json({ success: true })
}
