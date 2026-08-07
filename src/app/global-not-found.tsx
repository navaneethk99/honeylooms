import Link from 'next/link'
import { Fraunces } from 'next/font/google'

const editorialFont = Fraunces({
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
  subsets: ['latin'],
  weight: 'variable',
})

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          alignItems: 'center',
          background: '#f5f1e8',
          color: '#24231f',
          display: 'flex',
          fontFamily: 'var(--font-geist-sans), sans-serif',
          justifyContent: 'center',
          margin: 0,
          minHeight: '100svh',
          padding: '2rem 1.25rem',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: '70rem' }}>
          <p
            style={{
              color: '#8a6718',
              fontSize: '10px',
              letterSpacing: '0.24em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Error 404
          </p>
          <h1
            className={editorialFont.className}
            style={{
              fontSize: 'clamp(5rem, 18vw, 11rem)',
              fontWeight: 400,
              letterSpacing: '-0.07em',
              lineHeight: 0.75,
              margin: '1.25rem 0 0',
            }}
          >
            Lost in the weave.
          </h1>
          <p
            style={{
              color: 'rgb(36 35 31 / 65%)',
              fontSize: '1rem',
              lineHeight: 1.6,
              margin: '2.5rem auto 0',
              maxWidth: '24rem',
            }}
          >
            The page you are looking for is not here, or may have moved.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              justifyContent: 'center',
              marginTop: '2.25rem',
            }}
          >
            <Link
              href="/"
              style={{
                borderBottom: '1px solid #24231f',
                color: 'inherit',
                fontSize: '10px',
                letterSpacing: '0.18em',
                paddingBottom: '0.25rem',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Home
            </Link>
            <Link
              href="/shop"
              style={{
                borderBottom: '1px solid rgb(36 35 31 / 30%)',
                color: 'inherit',
                fontSize: '10px',
                letterSpacing: '0.18em',
                paddingBottom: '0.25rem',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Shop
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
