export const getMediaUrl = (url?: null | string): string => {
  if (!url) return ''

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const baseURL =
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''

  if (!baseURL) {
    return url
  }

  return new URL(url, baseURL).toString()
}
