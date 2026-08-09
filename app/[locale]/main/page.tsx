import type { Metadata } from 'next'
import { pageMetadata } from '../../chrome'
import { notFound } from 'next/navigation'
import { PlayScreen } from '@/components/game/PlayScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}


/** Title, description, canonical and hreflang from the same strings the
 *  page renders — see lib/site.ts. */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', 'main')
}

export default function MainPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <PlayScreen locale={params.locale} />
}
