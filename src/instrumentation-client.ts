import posthog from 'posthog-js'

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const isPayloadAdmin = window.location.pathname.startsWith('/admin')

if (projectToken && !isPayloadAdmin) {
  posthog.init(projectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: 'history_change',
    defaults: '2026-05-30',
    disable_session_recording: false,
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
