import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n'
import { SiteFooter } from '@/components/site/SiteFooter'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

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
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter locale={params.locale} />
    </div>
  )
}
