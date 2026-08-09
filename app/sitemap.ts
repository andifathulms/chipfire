import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { HREFLANG, ROUTES, urlFor } from '@/lib/site'

/**
 * Twelve URLs, none of which were declared anywhere before this.
 *
 * Built from the same ROUTES list the page titles and the hreflang alternates
 * read, so a route cannot appear in the navigation and be missing from the
 * sitemap — the failure mode of a hand-maintained one.
 *
 * Each entry carries its own translations, which is the sitemap-side half of
 * the hreflang pairing already in the page heads. Stating it in both places is
 * what search engines ask for.
 */
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = (route: (typeof ROUTES)[number]) =>
    Object.fromEntries(LOCALES.map((locale) => [HREFLANG[locale], urlFor(locale, route)]))

  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: urlFor(locale, route),
      // The home page of each locale is the way in; the rest hang off it.
      priority: route === '' ? 1 : 0.7,
      alternates: { languages: languages(route) },
    })),
  )
}
