import Link from 'next/link'
import { copy, isLocale, type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'

export { generateStaticParams } from './layout'

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const t = copy(locale)

  const links = [
    { href: `/${locale}/belajar/`, title: t.learn, hint: t.learnHint },
    { href: `/${locale}/main/`, title: t.play, hint: t.playHint },
    { href: `/${locale}/tanding/`, title: t.versus, hint: t.versusHint },
    { href: `/${locale}/ulang/`, title: t.replay, hint: t.replayHint },
  ]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="border-b border-trace/20 pb-6">
        <h1 className="font-numeral text-5xl tracking-tight">Rantai</h1>
        <p className="mt-3 max-w-prose text-trace-soft">{t.tagline}</p>
      </header>

      <ol className="flex max-w-prose flex-col gap-2 border-l border-trace/30 pl-4 text-sm text-trace-soft">
        {t.rules.map((rule, position) => (
          <li key={rule} className="flex gap-3">
            <span className="font-numeral text-trace">{position + 1}</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>

      <nav className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-trace/30 bg-chart-deep px-5 py-4 transition-colors hover:border-trace"
          >
            <span className="font-numeral text-xl">{link.title}</span>
            <span className="mt-1 block text-sm text-trace-soft">{link.hint}</span>
          </Link>
        ))}
      </nav>

      <footer className="flex items-center justify-between text-xs text-trace-faint">
        <span>{t.footer}</span>
        <Link href={locale === 'id' ? '/en/' : '/id/'} className="underline">
          {locale === 'id' ? 'English' : 'Bahasa Indonesia'}
        </Link>
      </footer>
    </main>
  )
}
