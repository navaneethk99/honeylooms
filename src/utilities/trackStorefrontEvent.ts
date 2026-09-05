'use client'

import posthog from 'posthog-js'

// Keep development and preview traffic out of the store's conversion funnel.
// Callers pass product identifiers and interaction labels, never customer details.
export function trackStorefrontEvent(
  event: string,
  properties: Record<string, string | number | boolean | null | undefined> = {},
) {
  if (
    typeof window === 'undefined' ||
    !['honeylooms.in', 'www.honeylooms.in'].includes(window.location.hostname)
  ) {
    return
  }

  try {
    posthog.capture(event, properties)
  } catch {
    // Analytics must never interrupt shopping or checkout.
  }
}
