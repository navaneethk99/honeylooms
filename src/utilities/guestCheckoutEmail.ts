import type { PayloadRequest } from 'payload'

export const REGISTERED_EMAIL_CHECKOUT_MESSAGE =
  'An account already exists for this email address. Please sign in to continue.'

export const normalizeGuestCheckoutEmail = (email: string) => email.trim().toLowerCase()

export const isRegisteredEmail = async ({
  email,
  payload,
}: {
  email: string
  payload: PayloadRequest['payload']
}) => {
  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: normalizeGuestCheckoutEmail(email) } },
  })

  return Boolean(users.docs[0])
}

export const assertGuestCheckoutEmailIsAvailable = async ({
  email,
  req,
}: {
  email: string
  req: PayloadRequest
}) => {
  const normalizedEmail = normalizeGuestCheckoutEmail(email)

  if (!req.user && (await isRegisteredEmail({ email: normalizedEmail, payload: req.payload }))) {
    throw new Error(REGISTERED_EMAIL_CHECKOUT_MESSAGE)
  }

  return normalizedEmail
}
