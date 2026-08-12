'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          alignItems: 'center',
          background: '#fff',
          color: '#24231f',
          display: 'flex',
          fontFamily: 'sans-serif',
          justifyContent: 'center',
          margin: 0,
          minHeight: '100svh',
          padding: '2rem 1.25rem',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: '34rem' }}>
          <p
            style={{
              color: '#8a6718',
              fontSize: '10px',
              letterSpacing: '0.24em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Honeylooms
          </p>
          <h1
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(2.75rem, 10vw, 5.5rem)',
              fontWeight: 400,
              letterSpacing: '-0.05em',
              lineHeight: 0.95,
              margin: '1.25rem 0 0',
            }}
          >
            Something slipped the weave.
          </h1>
          <p style={{ color: 'rgb(36 35 31 / 65%)', lineHeight: 1.6, margin: '2rem 0 0' }}>
            There was an issue loading Honeylooms. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#24231f',
              border: 0,
              borderRadius: '999px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px',
              letterSpacing: '0.18em',
              marginTop: '2rem',
              padding: '0.9rem 1.4rem',
              textTransform: 'uppercase',
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
