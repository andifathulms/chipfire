import type { Metadata } from 'next'
import { pageMetadata } from '../../chrome'
import { notFound } from 'next/navigation'
import { P2PScreen } from '@/components/game/P2PScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}


/** Title, description, canonical and hreflang from the same strings the
 *  page renders — see lib/site.ts. */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', 'tanding')
}

export default function TandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <P2PScreen locale={params.locale} />
}
