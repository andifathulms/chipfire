import type { Metadata } from 'next'
import { pageMetadata } from '../../chrome'
import { notFound } from 'next/navigation'
import { PuzzleScreen } from '@/components/game/PuzzleScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}


/** Title, description, canonical and hreflang from the same strings the
 *  page renders — see lib/site.ts. */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', 'teka')
}

export default function TekaPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <PuzzleScreen locale={params.locale} />
}
