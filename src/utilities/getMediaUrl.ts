/**
 * Resolves a media URL and, when provided, replaces its final path segment
 * with a Payload-generated size filename.
 */
export const getMediaUrl = (url?: null | string, filename?: null | string): string => {
  if (!url) return ''

  const replaceFilename = (value: string) => {
    if (!filename) return value

    const [pathname, query = ''] = value.split(/([?#].*)/, 2)
    const directory = pathname.lastIndexOf('/')
    const sizedPath = `${pathname.slice(0, directory + 1)}${encodeURIComponent(filename)}`

    return `${sizedPath}${query}`
  }

  if (/^https?:\/\//i.test(url)) {
    return replaceFilename(url)
  }

  const baseURL =
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''

  if (!baseURL) {
    return replaceFilename(url)
  }

  return replaceFilename(new URL(url, baseURL).toString())
}
