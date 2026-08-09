'use client'

import { isDecisive, type PostMortem } from '@/lib/ai/postmortem'
import { cellName } from '@/lib/engine/notation'
import type { Locale } from '@/lib/i18n'

/**
 * Where the game got away from you.
 *
 * Every number here traces to the integer weights in evaluate.ts, applied by
 * the same alpha-beta the opponent runs on, at a depth this panel states out
 * loud. That qualifier is not decoration and is not optional: a deeper search
 * would give different answers, and the honest sentence is always "according to
 * a search of depth N", never "you lost here". Dropping it would turn an
 * inspectable claim into an authoritative one, which is the characteristic way
 * a feature like this goes wrong.
 *
 * The turning point and the costliest move are shown as two separate findings
 * because they answer two different questions, and merging them would misreport
 * both — see the note in lib/ai/postmortem.ts.
 */
const COPY = {
  title: { id: 'Di mana permainan ini lepas', en: 'Where this game got away' },
  ask: { id: 'Telusuri permainan ini', en: 'Review this game' },
  running: { id: 'Menelusuri…', en: 'Reviewing…' },
  failed: { id: 'Penelusuran gagal dijalankan.', en: 'The review failed to run.' },

  basis: {
    id: (depth: number) =>
      `Menurut pencarian kedalaman ${depth} dengan bobot yang sama dipakai AI. Pencarian lebih dalam bisa menjawab lain.`,
    en: (depth: number) =>
      `According to a search of depth ${depth}, using the same weights the AI plays on. A deeper search could answer differently.`,
  },
  partial: {
    id: 'Waktu telusur habis sebelum seluruh permainan selesai diperiksa, jadi jawaban ini sementara.',
    en: 'The review ran out of time before the whole game was checked, so this answer is provisional.',
  },

  turningPoint: { id: 'Titik balik', en: 'Turning point' },
  turningPointBody: {
    id: (turn: number, best: string) =>
      `Langkah ${turn} adalah terakhir kalinya masih ada langkah yang dinilai menguntungkanmu — ${best}. Setelah itu tidak ada lagi.`,
    en: (turn: number, best: string) =>
      `Move ${turn} was the last time any move was still scored in your favour — ${best}. After it, none were.`,
  },
  turningPointTook: {
    id: (played: string) => `Kamu memainkan ${played}.`,
    en: (played: string) => `You played ${played}.`,
  },
  turningPointSame: {
    id: 'Dan itu memang langkah terbaik yang ada — yang membalikkan keadaan datang dari sisi lawan.',
    en: 'And it was the best move available — what turned it came from the other side.',
  },
  forcedWin: {
    id: 'Pencarian melihat kemenangan paksa dari sana.',
    en: 'The search saw a forced win from there.',
  },
  neverAhead: {
    id: 'Tidak ada satu pun giliranmu yang dinilai menguntungkan. Kamu tertinggal sejak awal, bukan tergelincir di satu langkah.',
    en: 'Not one of your turns was scored in your favour. You were behind throughout rather than slipping at a single move.',
  },

  costliest: { id: 'Langkah paling mahal', en: 'Costliest move' },
  costliestBody: {
    id: (turn: number, played: string, best: string) =>
      `Langkah ${turn}: ${played}, sementara ${best} dinilai jauh lebih baik.`,
    en: (turn: number, played: string, best: string) =>
      `Move ${turn}: ${played}, where ${best} scored considerably better.`,
  },
  clean: {
    id: 'Tidak ada satu langkah pun yang jelas lebih buruk dari alternatifnya.',
    en: 'No single move was clearly worse than the alternatives available to it.',
  },
} as const

export function PostMortemPanel({
  review,
  running,
  error,
  cols,
  locale,
  onRun,
}: {
  review: PostMortem | null
  running: boolean
  error: string | null
  cols: number
  locale: Locale
  onRun: () => void
}) {
  if (review === null) {
    return (
      <div className="flex flex-col gap-xs">
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="self-start border border-trace-rule px-3 py-1.5 text-sm transition-colors hover:bg-chart-deep disabled:opacity-50"
        >
          {running ? COPY.running[locale] : COPY.ask[locale]}
        </button>
        {error !== null ? (
          <p role="alert" className="text-sm text-p1-ink">
            {COPY.failed[locale]}
          </p>
        ) : null}
      </div>
    )
  }

  const point = review.turningPoint
  const costliest = review.costliest

  return (
    <section className="flex flex-col gap-sm text-sm">
      <h3 className="heading-panel">{COPY.title[locale]}</h3>

      <div className="flex flex-col gap-xs border-l-2 border-trace-rule py-1 pl-sm">
        <p className="label-micro">{COPY.turningPoint[locale]}</p>
        {point === null ? (
          <p className="max-w-measure text-trace-soft">{COPY.neverAhead[locale]}</p>
        ) : (
          <>
            <p className="max-w-measure">
              {COPY.turningPointBody[locale](point.turn, cellName(cols, point.best))}
            </p>
            <p className="max-w-measure text-trace-soft">
              {point.best === point.played
                ? COPY.turningPointSame[locale]
                : COPY.turningPointTook[locale](cellName(cols, point.played))}
              {isDecisive(point.bestScore) ? ` ${COPY.forcedWin[locale]}` : ''}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-xs border-l-2 border-trace-rule py-1 pl-sm">
        <p className="label-micro">{COPY.costliest[locale]}</p>
        {costliest === null ? (
          <p className="max-w-measure text-trace-soft">{COPY.clean[locale]}</p>
        ) : (
          <p className="max-w-measure">
            {COPY.costliestBody[locale](
              costliest.turn,
              cellName(cols, costliest.played),
              cellName(cols, costliest.best),
            )}
          </p>
        )}
      </div>

      {/*
       * Set at the same size as the findings, not below them.
       *
       * The whole licence to say "move 79 was your turning point" is the
       * clause that follows it — a depth-3 search using stated weights, which
       * a deeper one could contradict. Rendering that clause as the smallest
       * and faintest text in the panel was the typography disagreeing with the
       * copy, and between the two the typography is what people act on.
       */}
      <p className="max-w-measure border-t border-trace-hairline pt-sm text-sm text-trace-soft">
        {COPY.basis[locale](review.depth)}
        {review.partial ? ` ${COPY.partial[locale]}` : ''}
      </p>
    </section>
  )
}
