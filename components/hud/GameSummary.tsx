'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GameRecord } from '@/lib/engine/replay'
import { encodeRecord } from '@/lib/share'
import type { Locale } from '@/lib/i18n'
import type { Stats } from '@/lib/stats'

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
}: {
  locale: Locale
  record: GameRecord
  stats: Stats
}) {
  const [copied, setCopied] = useState(false)
  const code = encodeRecord(record)
  const total = stats.played.hotseat + stats.played.ai + stats.played.p2p

  return (
    <section className="flex flex-col gap-2 border border-trace/25 p-4 text-sm">
      <p className="text-trace-soft">{COPY.code[locale]}</p>
      <code className="block break-all border border-trace/20 bg-chart-deep p-2 font-mono text-xs">
        {code}
      </code>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code)
            setCopied(true)
          }}
          className="border border-trace/30 px-3 py-1 transition-colors hover:bg-chart-deep"
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
    </section>
  )
}
