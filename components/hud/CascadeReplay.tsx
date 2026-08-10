'use client'

import type { CascadeReview } from '@/components/cascade/useCascadeReview'
import type { Locale } from '@/lib/i18n'

/**
 * The controls for re-watching the last cascade.
 *
 * Quiet until asked for. Most moves set off nothing worth a second look, and a
 * transport bar sitting under the board every turn would be four controls the
 * player has to ignore in order to play.
 */
const COPY = {
  rewatch: { id: 'Putar ulang ledakan', en: 'Replay that cascade' },
  none: { id: 'Langkah terakhir tidak memicu ledakan.', en: 'The last move set nothing off.' },
  back: { id: 'Mundur satu tahap', en: 'Back one generation' },
  forward: { id: 'Maju satu tahap', en: 'Forward one generation' },
  play: { id: 'Jalankan', en: 'Play' },
  pause: { id: 'Jeda', en: 'Pause' },
  close: { id: 'Tutup', en: 'Close' },
  stage: { id: 'Tahap', en: 'Generation' },
  of: { id: 'dari', en: 'of' },
} as const

const BUTTON =
  'control-target-square border border-trace-rule px-2 py-1 transition-colors hover:bg-chart-deep disabled:opacity-40 disabled:hover:bg-transparent'

export function CascadeReplay({
  review,
  explosions,
  busy,
  locale,
}: {
  review: CascadeReview
  /** Explosions in the cascade under review; zero means there is nothing to see. */
  explosions: number
  /** A cascade is still running, or the game is over — nothing to replay yet,
   *  but the control keeps its place rather than vanishing. */
  busy: boolean
  locale: Locale
}) {
  /*
   * A fixed floor, so this block is the same height whether it is offering the
   * button, showing the transport bar, or waiting with nothing to replay.
   * Returning null here collapsed the rail below it on every single move.
   */
  const shell = 'flex min-h-[2.75rem] items-center'

  if (!review.open) {
    return (
      <div className={shell}>
        <button
          type="button"
          onClick={review.start}
          disabled={busy || review.total === 0 || explosions === 0}
          className={`${BUTTON} text-sm`}
        // A move that detonated nothing still has frames — the placement — and
        // offering to replay it would be offering to watch one orb land.
          title={explosions === 0 ? COPY.none[locale] : undefined}
        >
          {COPY.rewatch[locale]}
        </button>
      </div>
    )
  }

  return (
    <div className={`${shell} flex-wrap gap-xs border border-trace-rule px-2 py-1.5 text-sm`}>
      <button
        type="button"
        onClick={() => review.step(-1)}
        disabled={!review.canStepBack}
        aria-label={COPY.back[locale]}
        className={BUTTON}
      >
        <span aria-hidden="true">←</span>
      </button>

      <button type="button" onClick={review.toggle} className={`${BUTTON} min-w-[4.5rem]`}>
        {review.playing ? COPY.pause[locale] : COPY.play[locale]}
      </button>

      <button
        type="button"
        onClick={() => review.step(1)}
        disabled={!review.canStepOn}
        aria-label={COPY.forward[locale]}
        className={BUTTON}
      >
        <span aria-hidden="true">→</span>
      </button>

      {/*
       * Generation, not frame. The number means something in the rules — how
       * many waves deep into the chain this is — and it is the thing a player
       * is actually trying to see when they ask to watch it again.
       */}
      <span aria-live="polite" className="ml-auto flex items-baseline gap-1 text-trace-soft">
        <span className="label-micro">{COPY.stage[locale]}</span>
        <span className="font-numeral text-trace">{review.index + 1}</span>
        <span className="text-xs">{COPY.of[locale]}</span>
        <span className="font-numeral">{review.total}</span>
      </span>

      <button type="button" onClick={review.stop} className={`${BUTTON} text-xs`}>
        {COPY.close[locale]}
      </button>
    </div>
  )
}
