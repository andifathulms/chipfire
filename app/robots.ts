import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * There was no robots.txt at all, which is not the same as an empty one: a
 * crawler that finds nothing has no pointer to the sitemap.
 *
 * Everything is allowed. This is a static site with no private routes, and
 * excluding _next would only stop a crawler fetching the CSS and JS it needs to
 * render the page it is judging.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}sitemap.xml`,
  }
}
