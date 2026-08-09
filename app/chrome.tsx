import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { basePath, siteUrl } from '@/lib/site'

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

const mono = localFont({
  src: './fonts/IBMPlexMono.woff2',
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
})

export const FONT_VARIABLES = `${display.variable} ${sans.variable} ${mono.variable}`

export const viewport: Viewport = {
  themeColor: '#EDEAE3',
  width: 'device-width',
  initialScale: 1,
}

/** The title and description the whole site shared before this pass. Split per
 *  route in the commit that follows. */
const TITLE = 'Chipfire — reaksi berantai'
const DESCRIPTION =
  'Permainan strategi grid dengan ledakan berantai. Hotseat, lawan AI, dan multiplayer peer-to-peer tanpa server.'

/** The head every page shares. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Chipfire',
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${basePath}/favicon.svg`, type: 'image/svg+xml' },
      { url: `${basePath}/chipfire-icon-32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${basePath}/chipfire-icon-16.png`, sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: `${basePath}/chipfire-icon-180.png`, sizes: '180x180' },
  },
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
