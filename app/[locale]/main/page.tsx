import { notFound } from 'next/navigation'
import { HotseatGame } from '@/components/game/HotseatGame'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function MainPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <HotseatGame locale={params.locale} />
}
