const LEGACY_SSL_MODES = new Set(['prefer', 'require', 'verify-ca'])

export const getDatabaseURL = (value?: string): string => {
  if (!value) return ''

  try {
    const url = new URL(value)
    const sslmode = url.searchParams.get('sslmode')

    if (sslmode && LEGACY_SSL_MODES.has(sslmode)) {
      url.searchParams.set('sslmode', 'verify-full')
    }

    return url.toString()
  } catch {
    return value
  }
}
