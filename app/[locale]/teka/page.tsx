import { notFound } from 'next/navigation'
import { PuzzleScreen } from '@/components/game/PuzzleScreen'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TekaPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <PuzzleScreen locale={params.locale} />
}
