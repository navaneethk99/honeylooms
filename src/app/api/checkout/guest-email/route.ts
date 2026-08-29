import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { isRegisteredEmail, normalizeGuestCheckoutEmail } from '@/utilities/guestCheckoutEmail'

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: unknown }
  const email = typeof body.email === 'string' ? normalizeGuestCheckoutEmail(body.email) : ''

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const registered = await isRegisteredEmail({ email, payload })

  return NextResponse.json({ registered })
}
