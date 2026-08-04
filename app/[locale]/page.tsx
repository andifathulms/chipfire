import Link from 'next/link'
import { copy, isLocale, type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { Wordmark } from '@/components/site/Mark'

export { generateStaticParams } from './layout'

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const t = copy(locale)

  /*
   * Four equally weighted cards asked the visitor to make a choice before they
   * knew what the game was. These are ranked instead: play, then learn if the
   * rules have not landed, then the two modes that presuppose you already have
   * a game or a second device.
   */
  const secondary = [
    { href: `/${locale}/tanding/`, title: t.versus, hint: t.versusHint },
    { href: `/${locale}/ulang/`, title: t.replay, hint: t.replayHint },
  ]

  return (
    <main className="mx-auto flex w-full flex-1 max-w-4xl flex-col justify-center gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        {/* The mark is the game's rule drawn once — a core shedding to four
            neighbours — so it belongs above the tagline that explains it. */}
        <h1>
          <Wordmark size="lg" />
        </h1>
        <p className="max-w-prose text-lg leading-snug text-trace-soft">{t.tagline}</p>
      </header>

      <nav className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* The primary action is filled, not outlined. On a page of hairlines
              one solid block is unmistakably the way in. */}
          <Link
            href={`/${locale}/main/`}
            className="group flex flex-col justify-between gap-2 border border-trace bg-trace px-5 py-4 text-chart transition-opacity hover:opacity-90"
          >
            <span className="font-numeral text-2xl">{t.play}</span>
            <span className="text-sm opacity-80">{t.playHint}</span>
          </Link>

          <Link
            href={`/${locale}/belajar/`}
            className="flex flex-col justify-between gap-2 border border-trace bg-chart-deep px-5 py-4 transition-colors hover:bg-chart"
          >
            <span className="font-numeral text-2xl">{t.learn}</span>
            <span className="text-sm text-trace-soft">{t.learnHint}</span>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {secondary.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-baseline gap-3 border border-trace/30 px-5 py-3 transition-colors hover:border-trace"
            >
              <span className="font-numeral text-base">{link.title}</span>
              <span className="text-sm text-trace-soft">{link.hint}</span>
            </Link>
          ))}
        </div>
      </nav>

      <ol className="flex max-w-prose flex-col gap-2 border-l border-trace/30 pl-4 text-sm text-trace-soft">
        {t.rules.map((rule, position) => (
          <li key={rule} className="flex gap-3">
            <span className="font-numeral text-trace">{position + 1}</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>

      {/* The bottom bar that used to live here is now SiteFooter, shared by
          every page — one seam for the whole site rather than one per page. */}
    </main>
  )
}
