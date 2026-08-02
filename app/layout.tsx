import type { Metadata, Viewport } from 'next'
import './globals.css'

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
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
