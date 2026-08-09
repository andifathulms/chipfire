import { LOCALES, copy, type Locale } from './i18n'

/**
 * Where the site lives, and what is on it.
 *
 * Kept free of React and of next/font so the sitemap and robots conventions can
 * import it without dragging a font loader into their build, and so there is one
 * list of routes rather than one per consumer.
 */

/*
 * Icon, social and sitemap URLs are not rewritten by Next the way <Link> hrefs
 * are — whatever goes into `metadata` is emitted verbatim. Under the Pages
 * subpath a bare "/favicon.svg" is a 404 that never reproduces in `next dev`,
 * where basePath is stripped.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Open Graph and sitemaps need absolute URLs, which means an origin the build
 *  cannot infer. Override when the site moves. */
export const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

/** Trailing slash to match `trailingSlash: true`, so nothing redirects. */
export const siteUrl = `${origin}${basePath}/`

/**
 * Every page, once. `''` is the locale root.
 *
 * The sitemap, the hreflang alternates and the per-page titles all read this,
 * so a route added here appears in all three and cannot be half-registered.
 */
export const ROUTES = ['', 'main', 'belajar', 'teka', 'tanding', 'ulang'] as const

export type Route = (typeof ROUTES)[number]

export function pathFor(locale: Locale, route: Route): string {
  return route === '' ? `${locale}/` : `${locale}/${route}/`
}

export function urlFor(locale: Locale, route: Route): string {
  return `${siteUrl}${pathFor(locale, route)}`
}

export type PageMeta = {
  readonly title: string
  readonly description: string
}

/**
 * A page's title and description, taken from the strings the page itself
 * renders.
 *
 * Every route except the home page is described by the same sentence the home
 * page uses to link to it, and the home page is described by its own lede. That
 * is deliberate and it is the whole point: a description written separately is
 * a description that drifts, and a stale one is worse than none. If a hint
 * changes, the metadata changes with it because there is only one string.
 */
export function metaFor(locale: Locale, route: Route): PageMeta {
  const t = copy(locale)

  switch (route) {
    case '':
      return { title: `Chipfire — ${t.siteTagline}`, description: t.lede }
    case 'main':
      return { title: `${t.play} — Chipfire`, description: t.playHint }
    case 'belajar':
      return { title: `${t.learn} — Chipfire`, description: t.learnHint }
    case 'teka':
      return { title: `${t.puzzles} — Chipfire`, description: t.puzzlesHint }
    case 'tanding':
      return { title: `${t.versus} — Chipfire`, description: t.versusHint }
    case 'ulang':
      return { title: `${t.replay} — Chipfire`, description: t.replayHint }
    default: {
      const exhaustive: never = route
      throw new Error(`unhandled route: ${String(exhaustive)}`)
    }
  }
}

/** BCP 47 for the two locales, for `hreflang` and `og:locale`. */
export const HREFLANG: Record<Locale, string> = { id: 'id', en: 'en' }
export const OG_LOCALE: Record<Locale, string> = { id: 'id_ID', en: 'en_US' }

/**
 * Canonical plus every translation of the same page.
 *
 * `x-default` points at Indonesian because that is the default locale and the
 * root redirect sends there; without it a search engine has to guess which of
 * two equal alternatives to show someone whose language matches neither.
 */
export function alternatesFor(locale: Locale, route: Route) {
  const languages: Record<string, string> = {}
  for (const other of LOCALES) languages[HREFLANG[other]] = urlFor(other, route)
  languages['x-default'] = urlFor('id', route)

  return { canonical: urlFor(locale, route), languages }
}
