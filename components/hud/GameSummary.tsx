'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GameRecord, MoveSummary } from '@/lib/engine/replay'
import { encodeRecord } from '@/lib/share'
import type { Locale } from '@/lib/i18n'
import type { Stats } from '@/lib/stats'
import { AvalancheChart } from './AvalancheChart'
import { Seismogram } from './Seismogram'

const COPY = {
  code: { id: 'Kode permainan', en: 'Game code' },
  copy: { id: 'Salin kode', en: 'Copy code' },
  copied: { id: 'Tersalin', en: 'Copied' },
  open: { id: 'Buka di penelusur ulang', en: 'Open in the replay viewer' },
  played: { id: 'Dimainkan', en: 'Played' },
  longest: { id: 'Rantai terpanjang', en: 'Longest chain' },
} as const

/** A finished game is its move list, so the summary is the code itself. */
export function GameSummary({
  locale,
  record,
  stats,
  review = null,
  history,
  players,
}: {
  locale: Locale
  record: GameRecord
  stats: Stats
  /** The post-mortem, passed in rather than owned here — it needs a worker,
   *  and the summary is otherwise a pure render of a finished record. */
  review?: React.ReactNode
  /** The finished game, for the record strip. Derived from the move list, so
   *  it costs nothing that was not already computed. */
  history: readonly MoveSummary[]
  players: number
}) {
  const [copied, setCopied] = useState(false)
  const code = encodeRecord(record)
  const total = stats.played.hotseat + stats.played.ai + stats.played.p2p

  return (
    /*
     * Three peer groups in one box: the code, the review, the distribution.
     * They were framed three different ways — the first labelled in body text,
     * the other two with panel headings — so a box that contains one thing
     * looked like a box that contains one thing and then some appendices.
     */
    <section className="flex flex-col gap-sm border border-trace-hairline p-4 text-sm">
      <h2 className="heading-panel">{COPY.code[locale]}</h2>
      <code className="block break-all border border-trace-hairline bg-chart-deep p-2 font-mono text-xs">
        {code}
      </code>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code)
            setCopied(true)
          }}
          className="border border-trace-rule px-3 py-1 transition-colors hover:bg-chart-deep"
        >
          {copied ? COPY.copied[locale] : COPY.copy[locale]}
        </button>
        <Link href={`/${locale}/ulang/#${code}`} className="underline">
          {COPY.open[locale]}
        </Link>
        <span className="font-numeral text-xs text-trace-faint">
          {COPY.played[locale]}: {total} · {COPY.longest[locale]}: {stats.longestCascade}
        </span>
      </div>

      {/*
       * The whole game in one strip, at the moment it is over. This is the
       * screenshot: a long flat run and then the spike that ended it, which is
       * the shape of the model the game is built on rather than a decoration
       * of it.
       */}
      <div className="border-t border-trace-hairline pt-sm">
        <Seismogram locale={locale} moves={history} players={players} />
      </div>

      {review !== null ? (
        <div className="border-t border-trace-hairline pt-sm">{review}</div>
      ) : null}

      {/* The distribution, not just its maximum. A single longest-chain number
          is the least informative summary of a distribution it is possible to
          keep, and it was the only one being kept. */}
      <div className="border-t border-trace-hairline pt-sm">
        <AvalancheChart stats={stats} locale={locale} />
      </div>
    </section>
  )
}
