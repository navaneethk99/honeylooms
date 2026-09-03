import type { Theme } from './types'

export const themeLocalStorageKey = 'payload-theme'

// The storefront is designed dark-first. Keeping this in one shared value also
// ensures the server-rendered document and client theme provider agree.
export const defaultTheme = 'dark'

export const getImplicitPreference = (): Theme | null => {
  return 'dark'
}
