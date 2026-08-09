/**
 * Where the site lives.
 *
 * Free of React and of next/font so anything can import it without dragging a
 * font loader along.
 */

/*
 * Icon and social URLs are not rewritten by Next the way <Link> hrefs are —
 * whatever goes into `metadata` is emitted verbatim. Under the Pages subpath a
 * bare "/favicon.svg" is a 404 that never reproduces in `next dev`, where
 * basePath is stripped.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Open Graph needs absolute URLs, which means an origin the build cannot
 *  infer. Override when the site moves. */
export const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

/** Trailing slash to match `trailingSlash: true`, so nothing redirects. */
export const siteUrl = `${origin}${basePath}/`
