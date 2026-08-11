import configPromise from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
  randomInt,
} from 'crypto'
import { after } from 'next/server'
import { APIError, getPayload } from 'payload'

const OTP_EXPIRY_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_OTP_ATTEMPTS = 5

type RegistrationRequest = {
  action: 'register'
  email?: unknown
  name?: unknown
  password?: unknown
  passwordConfirm?: unknown
}

type VerificationRequest = {
  action: 'verify' | 'resend'
  email?: unknown
  otp?: unknown
}

const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const encryptionKey = createHash('sha256')
  .update(process.env.PAYLOAD_SECRET || '')
  .digest()

const hashOTP = (email: string, otp: string) =>
  createHmac('sha256', encryptionKey).update(`${email.toLowerCase()}:${otp}`).digest('hex')

const encryptPassword = (password: string) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv)
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`
}

const decryptPassword = (encryptedPassword: string) => {
  const [iv, authTag, encrypted] = encryptedPassword.split('.')
  if (!iv || !authTag || !encrypted) throw new Error('Invalid encrypted password.')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

const escapeHTML = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }
    return entities[character]
  })

const sendVerificationEmail = async ({
  email,
  name,
  otp,
  payload,
}: {
  email: string
  name: string
  otp: string
  payload: Awaited<ReturnType<typeof getPayload>>
}) => {
  const serverURL = getServerSideURL()

  await payload.sendEmail({
    to: email,
    subject: 'Verify your Honeylooms account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify your Honeylooms account</title>
          <style>
            body { margin: 0; padding: 0; background-color: #faf8f5; color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            .wrapper { padding: 40px 20px; background-color: #faf8f5; }
            .container { max-width: 600px; margin: 0 auto; overflow: hidden; border: 1px solid #f5f5f4; border-top: 4px solid #D9A321; border-radius: 12px; background-color: #ffffff; box-shadow: 0 10px 25px rgba(28,25,23,0.05); }
            .header { padding: 40px 30px; background-color: #141414; text-align: center; }
            .content { padding: 40px 35px; }
            h1 { margin: 0 0 12px; color: #1c1917; font-size: 22px; font-weight: 700; }
            .intro-text { margin: 0 0 24px; color: #44403c; font-size: 15px; line-height: 1.6; }
            .code-card { margin: 28px 0; padding: 24px; border: 1px solid #f5f5f4; border-radius: 8px; background-color: #faf8f5; text-align: center; }
            .code-label { margin: 0 0 12px; color: #78716c; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
            .code { margin: 0; color: #1c1917; font-size: 30px; font-weight: 700; letter-spacing: 8px; }
            .notice { margin: 0; padding: 12px 16px; border-left: 3px solid #D9A321; border-radius: 0 6px 6px 0; background-color: #faf8f5; color: #44403c; font-size: 13px; line-height: 1.6; }
            .footer { padding: 30px; border-top: 1px solid #f5f5f4; background-color: #faf8f5; color: #78716c; font-size: 12px; line-height: 1.6; text-align: center; }
            .footer a { color: #D9A321; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="${serverURL}/logo.svg" alt="Honeylooms" style="display:block;height:auto;max-width:240px;margin:0 auto;" />
              </div>
              <div class="content">
                <h1>Verify your email address</h1>
                <p class="intro-text">Dear ${escapeHTML(name)},</p>
                <p class="intro-text">Use the verification code below to finish creating your Honeylooms account.</p>
                <div class="code-card">
                  <p class="code-label">Your verification code</p>
                  <p class="code">${otp}</p>
                </div>
                <p class="notice">This code expires in 10 minutes. If you did not request an account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Honeylooms. All rights reserved.<br/>
                If you have any questions or concerns, please contact us at <a href="mailto:contact@honeylooms.in">contact@honeylooms.in</a>.
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

const queueVerificationEmail = ({
  email,
  name,
  otp,
  payload,
}: {
  email: string
  name: string
  otp: string
  payload: Awaited<ReturnType<typeof getPayload>>
}) => {
  after(async () => {
    try {
      await sendVerificationEmail({ email, name, otp, payload })
    } catch (error) {
      payload.logger.error({ err: error, msg: `Failed to send verification email to ${email}` })
    }
  })
}

const queueWelcomeEmail = ({
  email,
  name,
  payload,
}: {
  email: string
  name: string
  payload: Awaited<ReturnType<typeof getPayload>>
}) => {
  after(async () => {
    try {
      const serverURL = getServerSideURL()
      const { docs: products } = await payload.find({
        collection: 'products',
        depth: 1,
        draft: false,
        limit: 2,
        overrideAccess: true,
        sort: '-createdAt',
        where: { _status: { equals: 'published' } },
      })
      const productCards = products
        .map((product) => {
          const galleryImage = product.gallery?.[0]?.image
          const imageURL =
            galleryImage && typeof galleryImage === 'object' && galleryImage.url
              ? new URL(galleryImage.url, serverURL).toString()
              : null
          const imageAlt =
            galleryImage && typeof galleryImage === 'object' ? galleryImage.alt : product.title

          return `
            <a href="${serverURL}/products/${product.slug}" class="product-card">
              ${imageURL ? `<img src="${imageURL}" alt="${escapeHTML(imageAlt)}" />` : ''}
              <span>${escapeHTML(product.title)}</span>
            </a>
          `
        })
        .join('')

      await payload.sendEmail({
        to: email,
        subject: 'Welcome to Honeylooms',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Welcome to Honeylooms</title>
              <style>
                body { margin: 0; padding: 0; background-color: #faf8f5; color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                .wrapper { padding: 40px 20px; background-color: #faf8f5; }
                .container { max-width: 600px; margin: 0 auto; overflow: hidden; border: 1px solid #f5f5f4; border-top: 4px solid #D9A321; border-radius: 12px; background-color: #ffffff; box-shadow: 0 10px 25px rgba(28,25,23,0.05); }
                .header { padding: 40px 30px; background-color: #141414; text-align: center; }
                .content { padding: 40px 35px; }
                h1 { margin: 0 0 12px; color: #1c1917; font-size: 24px; font-weight: 700; }
                .intro-text { margin: 0 0 18px; color: #44403c; font-size: 15px; line-height: 1.6; }
                .eyebrow { margin: 30px 0 14px; color: #78716c; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
                .products { display: flex; gap: 12px; }
                .product-card { display: block; flex: 1; overflow: hidden; border: 1px solid #f5f5f4; border-radius: 8px; color: #1c1917; font-size: 13px; font-weight: 600; text-align: center; text-decoration: none; }
                .product-card img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
                .product-card span { display: block; padding: 12px 8px; }
                .btn-container { margin: 32px 0 4px; text-align: center; }
                .btn { display: inline-block; border: 1px solid #D9A321; border-radius: 6px; background-color: #141414; padding: 14px 32px; color: #ffffff !important; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-decoration: none; }
                .footer { padding: 30px; border-top: 1px solid #f5f5f4; background-color: #faf8f5; color: #78716c; font-size: 12px; line-height: 1.6; text-align: center; }
                .footer a { color: #D9A321; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="container">
                  <div class="header">
                    <img src="${serverURL}/logo.svg" alt="Honeylooms" style="display:block;height:auto;max-width:240px;margin:0 auto;" />
                  </div>
                  <div class="content">
                    <h1>Welcome to Honeylooms, ${escapeHTML(name)}.</h1>
                    <p class="intro-text">We are delighted to have you with us. Discover thoughtfully made pieces that celebrate Indian craft and feel at home in your everyday wardrobe.</p>
                    ${productCards ? `<p class="eyebrow">Made for your wardrobe</p><div class="products">${productCards}</div>` : ''}
                    <div class="btn-container"><a href="${serverURL}/shop" class="btn">SHOP THE COLLECTION</a></div>
                  </div>
                  <div class="footer">
                    &copy; ${new Date().getFullYear()} Honeylooms. All rights reserved.<br/>
                    If you have any questions or concerns, please contact us at <a href="mailto:contact@honeylooms.in">contact@honeylooms.in</a>.
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    } catch (error) {
      payload.logger.error({ err: error, msg: `Failed to send welcome email to ${email}` })
    }
  })
}

const updatePendingRegistration = async ({
  email,
  encryptedPassword,
  name,
  payload,
}: {
  email: string
  encryptedPassword: string
  name: string
  payload: Awaited<ReturnType<typeof getPayload>>
}) => {
  // Keep updated_at unchanged because it also controls when another OTP email may be sent.
  const result = await payload.db.pool.query<{ id: number }>(
    `
      UPDATE account_verifications
      SET
        encrypted_password = $2,
        name = $3
      WHERE email = $1
      RETURNING id
    `,
    [email, encryptedPassword, name],
  )

  return Boolean(result.rows[0])
}

const takeVerificationEmailSlot = async ({
  email,
  payload,
}: {
  email: string
  payload: Awaited<ReturnType<typeof getPayload>>
}) => {
  const cooldownStartedBefore = new Date(Date.now() - RESEND_COOLDOWN_MS).toISOString()
  const reusableCode = await payload.db.pool.query<{
    encryptedOtp: string
    name: string
  }>(
    `
      UPDATE account_verifications
      SET updated_at = NOW()
      WHERE email = $1
        AND otp_attempts < $2
        AND expires_at > NOW()
        AND updated_at <= $3
      RETURNING encrypted_otp AS "encryptedOtp", name
    `,
    [email, MAX_OTP_ATTEMPTS, cooldownStartedBefore],
  )
  const reusableAccount = reusableCode.rows[0]
  if (reusableAccount) {
    return { name: reusableAccount.name, otp: decryptPassword(reusableAccount.encryptedOtp) }
  }

  const otp = randomInt(100000, 1000000).toString()
  const refreshedCode = await payload.db.pool.query<{ name: string }>(
    `
      UPDATE account_verifications
      SET
        encrypted_otp = $2,
        otp_hash = $3,
        otp_attempts = 0,
        expires_at = $4,
        updated_at = NOW()
      WHERE email = $1
        AND expires_at <= NOW()
        AND updated_at <= $5
      RETURNING name
    `,
    [
      email,
      encryptPassword(otp),
      hashOTP(email, otp),
      new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
      cooldownStartedBefore,
    ],
  )
  const refreshedAccount = refreshedCode.rows[0]

  return refreshedAccount ? { name: refreshedAccount.name, otp } : undefined
}

// A matching request consumes the remaining slots so the code can only succeed once. A match
// already waiting on the fifth failed update may still finish, but later requests stay locked out.
const claimVerificationAttempt = async ({
  email,
  otpHash,
  payload,
}: {
  email: string
  otpHash: string
  payload: Awaited<ReturnType<typeof getPayload>>
}) => {
  const result = await payload.db.pool.query<{
    encryptedPassword: string
    id: number
    isMatch: boolean
    name: string
  }>(
    `
      WITH eligible_attempt AS MATERIALIZED (
        SELECT id
        FROM account_verifications
        WHERE email = $1
          AND otp_attempts < $2
          AND expires_at > NOW()
      )
      UPDATE account_verifications AS verification
      SET
        otp_attempts = CASE
          WHEN verification.otp_hash = $3 THEN $2
          ELSE verification.otp_attempts + 1
        END,
        updated_at = NOW()
      FROM eligible_attempt
      WHERE verification.id = eligible_attempt.id
        AND verification.expires_at > NOW()
        AND (
          verification.otp_attempts < $2
          OR (
            verification.otp_hash = $3
            AND verification.otp_attempts = $2
          )
        )
      RETURNING
        verification.id,
        verification.name,
        verification.encrypted_password AS "encryptedPassword",
        verification.otp_hash = $3 AS "isMatch"
    `,
    [email, MAX_OTP_ATTEMPTS, otpHash],
  )
  const account = result.rows[0]

  return account?.isMatch ? account : undefined
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationRequest | VerificationRequest
    const payload = await getPayload({ config: configPromise })
    const email = getString(body.email).toLowerCase()

    if (!email || !email.includes('@'))
      throw new APIError('A valid email address is required.', 400)

    if (body.action === 'register') {
      const name = getString(body.name)
      const password = getString(body.password)
      const passwordConfirm = getString(body.passwordConfirm)
      if (!name || !password || password !== passwordConfirm) {
        throw new APIError('Please provide your name and matching passwords.', 400)
      }

      const existingUser = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      })
      if (existingUser.docs[0]) {
        return Response.json({ email })
      }

      const encryptedPassword = encryptPassword(password)
      const existingAccount = await updatePendingRegistration({
        email,
        encryptedPassword,
        name,
        payload,
      })

      if (existingAccount) {
        const verificationEmail = await takeVerificationEmailSlot({ email, payload })
        if (verificationEmail) {
          queueVerificationEmail({ email, payload, ...verificationEmail })
        }
        return Response.json({ email })
      }

      const otp = randomInt(100000, 1000000).toString()
      await payload.create({
        collection: 'account-verifications',
        data: {
          email,
          encryptedOtp: encryptPassword(otp),
          encryptedPassword,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
          name,
          otpAttempts: 0,
          otpHash: hashOTP(email, otp),
        },
        overrideAccess: true,
      })

      queueVerificationEmail({ email, name, otp, payload })
      return Response.json({ email })
    }

    if (body.action === 'resend') {
      const verification = await payload.find({
        collection: 'account-verifications',
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      })
      const account = verification.docs[0]
      if (!account) throw new APIError('Invalid verification request.', 400)

      const verificationEmail = await takeVerificationEmailSlot({ email, payload })
      if (!verificationEmail) {
        const cooldownRemaining =
          RESEND_COOLDOWN_MS - (Date.now() - new Date(account.updatedAt).getTime())
        if (cooldownRemaining > 0) {
          throw new APIError(
            `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another code.`,
            429,
          )
        }
        throw new APIError('That verification code is invalid or has expired.', 400)
      }

      queueVerificationEmail({ email, payload, ...verificationEmail })
      return Response.json({ email })
    }

    const otp = getString(body.otp)
    if (otp.length !== 6) {
      throw new APIError('That verification code is invalid or has expired.', 400)
    }

    const account = await claimVerificationAttempt({ email, otpHash: hashOTP(email, otp), payload })
    if (!account) throw new APIError('That verification code is invalid or has expired.', 400)

    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existingUser.docs[0])
      throw new APIError('An account already exists for this email address.', 409)

    await payload.create({
      collection: 'users',
      data: { email, name: account.name, password: decryptPassword(account.encryptedPassword) },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'account-verifications',
      id: account.id,
      overrideAccess: true,
    })
    queueWelcomeEmail({ email, name: account.name, payload })
    return Response.json({ email })
  } catch (error) {
    const message =
      error instanceof APIError ? error.message : 'Unable to process your verification request.'
    const status = error instanceof APIError ? error.status : 500
    return Response.json({ message }, { status })
  }
}
