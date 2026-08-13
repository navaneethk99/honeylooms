import type { ReactNode } from 'react'

import { connection } from 'next/server'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RenderParams } from '@/components/RenderParams'
import { AccountNav } from '@/components/AccountNav'

export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection()

  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  return (
    <section className="container py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <RenderParams className="mb-8" />
        <div
          className={
            user ? 'grid items-start gap-10 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-12' : 'w-full'
          }
        >
          {user ? <AccountNav /> : null}
          <div className="w-full min-w-0">{children}</div>
        </div>
      </div>
    </section>
  )
}
