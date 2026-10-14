import type { Metadata } from 'next'
import { pageMetadata } from '../chrome'
import Link from 'next/link'
import { copy, isLocale, type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { CascadeFigure } from '@/components/site/CascadeFigure'
import { SandpilePlate } from '@/components/site/SandpilePlate'
import { HeroBoard } from '@/components/site/HeroBoard'
import { MiniBoard, EMPTY_CELL, type MiniCell } from '@/components/board/MiniBoard'
import { BUTTON, BUTTON_PRIMARY } from '@/components/ui/styles'

export { generateStaticParams } from './layout'


/** Title, description, canonical and hreflang from the same strings the
 *  page renders — see lib/site.ts. */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return pageMetadata(isLocale(params.locale) ? params.locale : 'id', '')
}

/** A small position for a mode card, written the way the fixtures are:
 *  `a2` is player 0 with two orbs, `.` is empty. */
function cells(spec: string): MiniCell[] {
  return spec
    .trim()
    .split(/\s+/)
    .map((token) => (token === '.' ? EMPTY_CELL : ([token.charCodeAt(0) - 97, Number(token.slice(1))] as const)))
}

const ILLUSTRATIONS = {
  main: { cols: 5, cells: cells('a1 a2 . b1 b2  a2 . . . b1  . a1 . b2 .'), played: 1 },
  teka: { cols: 5, cells: cells('. b2 b1 . .  a1 a3 b2 . .  . a1 . b1 .'), played: 6 },
  belajar: { cols: 5, cells: cells('. . a1 . .  . a1 a3 a1 .  . . a1 . .'), played: 7 },
} as const

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const t = copy(locale)

  /*
   * Four cards of equal weight, because they are four equal ways in. Tanding
   * used to be one line of small text at the bottom — the feature that makes
   * this game unusual, behind the least visible link on the page. It gets the
   * one ink border among the four.
   */
  const modes = [
    { href: `/${locale}/main/`, title: t.play, hint: t.playHint, meta: t.playMeta, art: 'main' },
    {
      href: `/${locale}/tanding/`,
      title: t.versus,
      hint: t.versusHint,
      meta: t.versusMeta,
      art: 'tanding',
    },
    {
      href: `/${locale}/teka/`,
      title: t.puzzles,
      hint: t.puzzlesHint,
      meta: t.puzzlesMeta,
      art: 'teka',
    },
    {
      href: `/${locale}/belajar/`,
      title: t.learn,
      hint: t.learnHint,
      meta: t.learnMeta,
      art: 'belajar',
    },
  ] as const

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2xl px-4 py-xl lg:px-8">
      {/*
       * The thesis first: the moment the game is about, in the moment face,
       * beside a real game being played. Below lg they stack in the same
       * reading order.
       */}
      <section className="grid items-center gap-xl lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-lg">
          <h1 className="font-moment text-6xl">
            {t.heroTitle[0]}
            <br />
            <span className="text-p1-ink">{t.heroTitle[1]}</span>
          </h1>
          <p className="max-w-measure text-xl leading-snug">{t.lede}</p>
          <p className="max-w-measure text-base text-trace-soft">{t.tagline}</p>
          <div className="flex flex-wrap gap-sm">
            <Link href={`/${locale}/main/`} className={`${BUTTON_PRIMARY} px-6 text-base`}>
              {t.heroCta}
            </Link>
            <Link href={`/${locale}/belajar/`} className={`${BUTTON} px-5 text-base`}>
              {t.learnCta}
            </Link>
          </div>
        </div>

        <figure className="flex flex-col gap-sm">
          <HeroBoard locale={locale} />
          <figcaption className="text-xs text-trace-faint">{t.demoCaption}</figcaption>
        </figure>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="label-micro">{t.modesTitle}</h2>
        <ul className="grid gap-sm sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((mode) => (
            <li key={mode.href} className="flex">
              <Link
                href={mode.href}
                className={[
                  'group flex w-full flex-col gap-sm rounded-panel border bg-surface p-md transition-[border-color,box-shadow] hover:shadow-panel',
                  mode.art === 'tanding'
                    ? 'border-trace'
                    : 'border-trace-hairline hover:border-trace-rule',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className="flex h-20 items-center justify-center rounded-ctl bg-chart-deep"
                >
                  {mode.art === 'tanding' ? (
                    <span className="flex items-center gap-2">
                      <span className="h-12 w-7 rounded-[5px] border-2 border-trace" />
                      <span className="h-0 w-12 border-t-2 border-dashed border-trace-soft" />
                      <span className="h-12 w-7 rounded-[5px] border-2 border-trace" />
                    </span>
                  ) : (
                    <span className="w-24">
                      <MiniBoard
                        cells={ILLUSTRATIONS[mode.art].cells}
                        cols={ILLUSTRATIONS[mode.art].cols}
                        played={ILLUSTRATIONS[mode.art].played}
                      />
                    </span>
                  )}
                </span>
                <span className="font-display text-lg font-extrabold leading-tight [font-stretch:110%]">
                  {mode.title}
                </span>
                <span className="text-sm text-trace-soft">{mode.hint}</span>
                <span className="mt-auto text-xs text-trace-faint">{mode.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/*
       * The rules, then the worked example they describe: a move, two
       * generations in, and the result, drawn from applyMove's own frames.
       */}
      <section className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-md">
          <h2 className="font-moment text-3xl">{t.rulesTitle}</h2>
          <ol className="flex flex-col gap-sm">
            {t.rules.map((rule, position) => (
              <li
                key={rule}
                className="flex gap-md rounded-panel border border-trace-hairline bg-surface p-md"
              >
                <span className="font-moment text-3xl text-trace-faint">{position + 1}</span>
                <span className="text-base">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
        <CascadeFigure locale={locale} />
      </section>

      {/*
       * Last, deliberately: what a reader who already understands the game
       * gets for scrolling.
       */}
      <section className="border-t border-trace-hairline pt-xl">
        <SandpilePlate locale={locale} />
      </section>
    </main>
  )
}
