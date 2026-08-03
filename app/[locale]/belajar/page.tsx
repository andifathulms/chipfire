import { notFound } from 'next/navigation'
import { TutorialScreen } from '@/components/game/TutorialScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function BelajarPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <TutorialScreen locale={params.locale} />
}
