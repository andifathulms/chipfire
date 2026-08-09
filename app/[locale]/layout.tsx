import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale } from '@/lib/i18n'
import { SiteFooter } from '@/components/site/SiteFooter'
import { FONT_VARIABLES, baseMetadata, viewport } from '../chrome'
import '../globals.css'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export { viewport }

/**
 * This is a root layout, not a nested one, which is the point: `<html lang>`
 * has to say what language the page is in, only a root layout renders <html>,
 * and until now a single root hardcoded `lang="id"` onto every English page in
 * the site.
 *
 * Titles and canonicals belong to the pages, not here — see chrome.tsx.
 */
export const metadata: Metadata = baseMetadata

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()

  /*
   * The column is what keeps the footer honest. Each page's <main> used to be
   * min-h-screen, so simply appending a footer would have pushed every page
   * into a scroll exactly one footer tall — and on the game screens it would
   * have shoved the viewport-fitted board out of view. The mains are flex-1
   * inside this instead, so page and footer share one screen.
   */
  return (
    <html lang={params.locale} className={FONT_VARIABLES}>
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter locale={params.locale} />
        </div>
      </body>
    </html>
  )
}
