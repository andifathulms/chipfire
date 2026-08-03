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

export const metadata: Metadata = {
  title: 'Rantai — reaksi berantai',
  description:
    'Permainan strategi grid dengan ledakan berantai. Hotseat, lawan AI, dan multiplayer peer-to-peer tanpa server.',
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
