import { notFound } from 'next/navigation'
import { ReplayScreen } from '@/components/game/ReplayScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}


export default function UlangPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <ReplayScreen locale={params.locale} />
}
