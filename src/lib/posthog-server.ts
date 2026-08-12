import 'server-only'

import { PostHog } from 'posthog-node'

let posthogServer: PostHog | null | undefined

export function getPostHogServer() {
  if (posthogServer !== undefined) return posthogServer

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

  posthogServer = projectToken
    ? new PostHog(projectToken, {
        flushAt: 1,
        flushInterval: 0,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://phg.honeylooms.in',
      })
    : null

  return posthogServer
}
