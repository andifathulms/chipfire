import { notFound } from 'next/navigation'
import { PlayScreen } from '@/components/game/PlayScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}


export default function MainPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <PlayScreen locale={params.locale} />
}
