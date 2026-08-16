import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { basePath, siteUrl, alternatesFor, metaFor, OG_LOCALE, type Route } from '@/lib/site'
import type { Locale } from '@/lib/i18n'
import { THEME_STORAGE_KEY } from '@/lib/theme'

/**
 * Everything the two root layouts share.
 *
 * There are two because `<html lang>` has to say which language the page is in,
 * only a root layout renders `<html>`, and the locale is a route parameter the
 * old single root never received — so every English page was served as
 * Indonesian. Two roots is how App Router lets a route segment decide that.
 *
 * Splitting them means the fonts, icons and social defaults have to live
 * somewhere both can read, or they drift apart. This is that somewhere.
 */

/*
 * Type per PRD §12, actually loaded. The families are vendored into the repo as
 * latin-subset woff2 (72 kB for all three) and self-hosted by next/font, so
 * neither the build nor the export ever touches a font CDN — and unlike naming
 * the families in CSS and hoping they are installed, the intended figures
 * really do render.
 */
const display = localFont({
  src: './fonts/SpaceGrotesk.woff2',
  weight: '300 700',
  variable: '--font-display',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

const sans = localFont({
  src: './fonts/IBMPlexSans.woff2',
  weight: '400 500',
  variable: '--font-sans',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

/*
 * Not preloaded, unlike the other two.
 *
 * Monospace appears in connection codes, state hashes, cell names in the move
 * list and the footer's year — none of it in a first paint, none of it in a
 * first interaction. Preloading it put 10 kB on the critical path of all six
 * routes to render text nobody has asked for yet. `display: swap` still
 * applies, so when a hash does appear the face arrives, and the metric-adjusted
 * fallback keeps it from shifting anything when it does.
 */
const mono = localFont({
  src: './fonts/IBMPlexMono.woff2',
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
})

export const FONT_VARIABLES = `${display.variable} ${sans.variable} ${mono.variable}`

/**
 * DESIGN-REWORK.md §6: "applied before first paint so there is no flash on a
 * night load." A static export has no server that knows this device's
 * preference, so the only way to avoid painting the wrong scheme first and
 * flipping a frame later is to read it synchronously before anything renders
 * — the one legitimate use of an inline script in this codebase, and why it
 * exists here rather than as a React effect. `data-theme` is the only thing
 * it touches; globals.css does the rest, exactly as `prefers-color-scheme`
 * already did before this existed.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(v==="light"||v==="dark"){document.documentElement.setAttribute("data-theme",v)}}catch(e){}})();`

export const viewport: Viewport = {
  /* The browser chrome follows the ground the page is actually on. One value
     here would frame a night board in daylight. */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDEAE3' },
    { media: '(prefers-color-scheme: dark)', color: '#171A18' },
  ],
  width: 'device-width',
  initialScale: 1,
}

/**
 * The parts of the head that are the same on every page, and nothing else.
 *
 * Deliberately carries no title, description or canonical. A layout applies to
 * every route beneath it, so a canonical here would quietly claim that
 * /en/main/ is /en/ — which is what it did before pages owned their own. A page
 * that forgets its metadata now shows up with no title, which is visible, in
 * preference to a wrong canonical, which is not.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Chipfire',
  /*
   * A static file rather than app/manifest.ts, which would seem the obvious
   * choice: that convention emits its own <link> and the href it emits has no
   * basePath, so under the Pages subpath the manifest 404s and nothing installs.
   *
   * Every URL inside the file is therefore relative, which resolves against the
   * manifest's own location — served at /chipfire/manifest.webmanifest, "id/"
   * is /chipfire/id/. That makes the file correct under any basePath and under
   * none, with nothing to template at build time.
   */
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    /*
     * SVG first for anything that understands it — the mark is five circles,
     * so it is smaller than the 32px PNG and sharp at every size. The PNGs are
     * the fallback for browsers that ignore an SVG favicon.
     */
    icon: [
      { url: `${basePath}/favicon.svg`, type: 'image/svg+xml' },
      { url: `${basePath}/chipfire-icon-32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${basePath}/chipfire-icon-16.png`, sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: `${basePath}/chipfire-icon-180.png`, sizes: '180x180' },
  },
  // Added to the home screen, it should open as a game, not as a browser tab.
  appleWebApp: { capable: true, title: 'Chipfire', statusBarStyle: 'default' },
}

/**
 * A page's metadata, built from the strings that page renders.
 *
 * Title, description, canonical, hreflang and the social cards all come out of
 * one call, so a route cannot end up with a canonical and no alternates, or a
 * social description that says something the page does not.
 */
export function pageMetadata(locale: Locale, route: Route): Metadata {
  const { title, description } = metaFor(locale, route)

  return {
    ...baseMetadata,
    title,
    description,
    alternates: alternatesFor(locale, route),
    openGraph: {
      type: 'website',
      siteName: 'Chipfire',
      url: alternatesFor(locale, route).canonical,
      title,
      description,
      locale: OG_LOCALE[locale],
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Chipfire' }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}
