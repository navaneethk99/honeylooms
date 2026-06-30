import type { ReactNode } from 'react'

import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RenderParams } from '@/components/RenderParams'
import { AccountNav } from '@/components/AccountNav'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  return (
    <div>
      <div className="container">
        <RenderParams className="" />
      </div>

      <div className="container flex flex-col gap-8 my-16 pb-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          {user && (
            <div className="w-full flex-none flex flex-col gap-4 md:gap-8 basis-1/5">
              <AccountNav />
            </div>
          )}
          <div className="min-h-screen w-full">{children}</div>
        </div>
      </div>
    </div>
  )
}
