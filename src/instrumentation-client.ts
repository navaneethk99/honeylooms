import posthog from 'posthog-js'

const projectToken =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  'phc_Csm6TwpxzVFhUPPhP3KhB8EESpgpdAYuBjBno695rY7v'
const isPayloadAdmin = window.location.pathname.startsWith('/admin')

if (projectToken && !isPayloadAdmin) {
  posthog.init(projectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://phg.honeylooms.in',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://eu.posthog.com',
    capture_pageview: 'history_change',
    capture_exceptions: {
      capture_console_errors: false,
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
    },
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    disable_session_recording: false,
    before_send: (event) => {
      if (event?.event !== '$exception') return event

      const properties = { ...event.properties }

      for (const property of ['$current_url', '$referrer']) {
        const value = properties[property]

        if (typeof value === 'string') {
          properties[property] = value.split(/[?#]/)[0]
        }
      }

      return { ...event, properties }
    },
    session_recording: {
      maskAllInputs: true,
      maskCapturedNetworkRequestFn: (request) => {
        if (request.name) {
          request.name = request.name.split('?')[0]
        }

        return request
      },
    },
  })
}
