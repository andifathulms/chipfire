'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { copy, type Locale } from '@/lib/i18n'
import { Wordmark } from './Mark'
import { ThemeToggle } from './ThemeToggle'

/**
 * The one top bar for the whole site.
 *
 * The four ways to play used to be listed only on the home page, three of
 * them in a footnote, so reaching Tanding from a game meant going home first.
 * Now every page carries all four. Ulang is not among them on purpose: it
 * needs a code from a finished game, so it is offered where a code exists —
 * the new-game lobby and the end of a game.
 *
 * Language and theme sit at the right as two compact controls. The language
 * link keeps you on the same page in the other language rather than sending
 * you home. On a phone there is room for only one of them beside the four
 * links, so the language switch moves to the footer there.
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const t = copy(locale)
  const pathname = usePathname() ?? `/${locale}/`

  const links = [
    { segment: 'main', label: t.play },
    { segment: 'teka', label: t.puzzles },
    { segment: 'tanding', label: t.versus },
    { segment: 'belajar', label: t.learn },
  ] as const

  const other: Locale = locale === 'id' ? 'en' : 'id'
  // /id/main/ → /en/main/. Everything after the locale segment is kept.
  const switched = pathname.replace(/^\/(id|en)(?=\/|$)/, `/${other}`)

  return (
    <header className="border-b border-trace-hairline bg-chart">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-3 py-2 sm:gap-4 sm:px-4 lg:px-8">
        <Link
          href={`/${locale}/`}
          aria-label="Chipfire"
          className="control-target -ml-1 inline-flex shrink-0 items-center rounded-ctl px-1 font-display text-lg font-bold [font-stretch:105%]"
        >
          {/* The name from sm up; on a phone the mark alone, so the bar stays
              one row and the board keeps its height. */}
          <Wordmark nameClassName="hidden sm:inline" />
        </Link>

        {/*
         * One row at every width. On a narrow phone the links scroll sideways
         * rather than wrapping into a second row of navigation above the board.
         */}
        <nav
          aria-label={t.navLabel}
          className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none]"
        >
          {links.map((link) => {
            const href = `/${locale}/${link.segment}/`
            const active = pathname.startsWith(`/${locale}/${link.segment}`)
            return (
              <Link
                key={link.segment}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'control-target inline-flex shrink-0 items-center rounded-ctl px-1.5 text-sm transition-colors sm:px-3',
                  active
                    ? 'bg-chart-deep font-semibold text-trace'
                    : 'text-trace-soft hover:bg-chart-deep hover:text-trace',
                ].join(' ')}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={switched}
            hrefLang={other}
            lang={other}
            aria-label={other === 'en' ? 'English' : 'Bahasa Indonesia'}
            className="control-target-square hidden items-center justify-center rounded-ctl border sm:inline-flex border-trace-hairline bg-surface font-display text-xs font-bold tracking-wide transition-colors hover:bg-chart-deep"
          >
            {other.toUpperCase()}
          </Link>
          <ThemeToggle locale={locale} />
        </div>
      </div>
    </header>
  )
}
