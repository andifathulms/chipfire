import type { Metadata } from 'next'
import { FONT_VARIABLES, THEME_INIT_SCRIPT, baseMetadata, viewport } from '../chrome'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import '../globals.css'

/**
 * A root layout for the bare `/` entry point, which is a redirect stub rather
 * than a page in either language.
 *
 * It exists because there are now two roots. Only a root layout may render
 * <html>, and the locale that belongs in `lang` is a route parameter — so the
 * locale tree owns its own root and this one owns the redirect. `(entry)` is a
 * route group, so the URL is still `/`.
 */
export const metadata: Metadata = baseMetadata

export { viewport }

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  // The stub sends everyone to the default locale, so that is what it is in.
  return (
    <html lang={DEFAULT_LOCALE} className={FONT_VARIABLES}>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts, react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
