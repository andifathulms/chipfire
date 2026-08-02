import { notFound } from 'next/navigation'
import { P2PScreen } from '@/components/game/P2PScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <P2PScreen locale={params.locale} />
}
