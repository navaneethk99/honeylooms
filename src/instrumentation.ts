import type { Instrumentation } from 'next'

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  try {
    const { getPostHogServer } = await import('./lib/posthog-server')
    const posthog = getPostHogServer()

    if (!posthog) return

    const digest =
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof error.digest === 'string'
        ? error.digest
        : undefined

    await posthog.captureExceptionImmediate(error, undefined, {
      nextjs_digest: digest,
      nextjs_render_source: context.renderSource,
      nextjs_route_path: context.routePath,
      nextjs_route_type: context.routeType,
      nextjs_router_kind: context.routerKind,
      request_method: request.method,
    })
  } catch (captureError) {
    console.error('[PostHog] Failed to capture a server exception', captureError)
  }
}
