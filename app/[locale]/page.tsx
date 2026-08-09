import Link from 'next/link'
import { copy, isLocale, type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { Wordmark } from '@/components/site/Mark'
import { CascadeFigure } from '@/components/site/CascadeFigure'

export { generateStaticParams } from './layout'

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const t = copy(locale)

  /*
   * Both of these presuppose something a first-time visitor does not have:
   * Tanding needs a second device with a person waiting at it, and Ulang needs
   * a game code from a game nobody has played yet. They used to occupy a full
   * row of cards the same size as the rules, which spent the most expensive
   * space on the page on two dead ends. One line, below everything.
   */
  const secondary = [
    { href: `/${locale}/tanding/`, title: t.versus, hint: t.versusHint },
    { href: `/${locale}/ulang/`, title: t.replay, hint: t.replayHint },
  ]

  return (
    <main className="mx-auto flex w-full flex-1 max-w-5xl flex-col justify-center gap-xl px-6 py-xl">
      {/*
       * Two columns where there is room, so the sentence that says what this
       * is and the picture that proves it are one glance apart rather than one
       * scroll. Below lg they stack in the same reading order.
       */}
      <div className="grid items-center gap-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-lg">
          <header className="flex flex-col gap-sm">
            {/* The mark is the game's rule drawn once — a core shedding to four
                neighbours. It identifies the page; it cannot explain it, so it
                no longer outweighs the sentence that does. */}
            <h1>
              <Wordmark size="lg" />
            </h1>
            {/* Full trace ink at the top of the ramp: on a first visit this is
                the most important text on the page, and it should look it. */}
            <p className="max-w-measure text-xl leading-snug">{t.lede}</p>
            <p className="max-w-measure text-base text-trace-soft">{t.tagline}</p>
          </header>

          <nav className="flex flex-wrap items-center gap-sm">
            {/* The primary action is filled, not outlined. On a page of
                hairlines one solid block is unmistakably the way in. */}
            <Link
              href={`/${locale}/main/`}
              className="flex flex-col border border-trace bg-trace px-lg py-sm text-chart transition-opacity hover:opacity-90"
            >
              <span className="font-numeral text-xl leading-snug">{t.play}</span>
              <span className="text-sm opacity-90">{t.playHint}</span>
            </Link>

            <Link
              href={`/${locale}/belajar/`}
              className="flex flex-col border border-trace/30 px-lg py-sm transition-colors hover:border-trace hover:bg-chart-deep"
            >
              <span className="font-numeral text-xl leading-snug">{t.learn}</span>
              <span className="text-sm text-trace-soft">{t.learnHint}</span>
            </Link>
          </nav>
        </div>

        <CascadeFigure locale={locale} />
      </div>

      {/*
       * The rules were four sentences of 14px grey below three rows of
       * navigation — the only thing on the page that explained the game, and
       * the last thing anyone would read. Three steps now, at body size, sat
       * directly under the figure they describe.
       */}
      <section className="flex flex-col gap-sm">
        <h2 className="label-micro">{t.rulesTitle}</h2>
        <ol className="grid max-w-measure gap-sm text-base text-trace-soft sm:max-w-none sm:grid-cols-3">
          {t.rules.map((rule, position) => (
            <li key={rule} className="flex gap-sm border-t border-trace/25 pt-sm">
              <span className="font-numeral text-base text-trace">{position + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-xs">
        <h2 className="label-micro">{t.moreWays}</h2>
        <ul className="flex flex-col gap-xs text-sm sm:flex-row sm:gap-lg">
          {secondary.map((link) => (
            <li key={link.href} className="flex items-baseline gap-xs">
              <Link
                href={link.href}
                className="underline decoration-trace/40 underline-offset-4 transition-colors hover:decoration-trace"
              >
                {link.title}
              </Link>
              <span className="text-trace-soft">{link.hint}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* The bottom bar that used to live here is now SiteFooter, shared by
          every page — one seam for the whole site rather than one per page. */}
    </main>
  )
}
