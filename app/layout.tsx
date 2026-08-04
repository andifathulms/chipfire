import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

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

const mono = localFont({
  src: './fonts/IBMPlexMono.woff2',
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
})

/*
 * Icon and social URLs are not rewritten by Next the way <Link> hrefs are —
 * whatever goes in `metadata` is emitted verbatim. Under the Pages subpath a
 * bare "/favicon.svg" is a 404, and it is a 404 that never reproduces in
 * `next dev`, where basePath is stripped. So the prefix is applied here.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/*
 * Open Graph needs absolute URLs, which means an origin the build cannot infer.
 * Override it when the site moves; the default is where Pages serves it.
 */
const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

const TITLE = 'Chipfire — reaksi berantai'
const DESCRIPTION =
  'Permainan strategi grid dengan ledakan berantai. Hotseat, lawan AI, dan multiplayer peer-to-peer tanpa server.'

export const metadata: Metadata = {
  metadataBase: new URL(`${origin}${basePath}/`),
  title: TITLE,
  description: DESCRIPTION,
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
  openGraph: {
    type: 'website',
    siteName: 'Chipfire',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'id_ID',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Chipfire' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export const viewport: Viewport = {
  themeColor: '#EDEAE3',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
