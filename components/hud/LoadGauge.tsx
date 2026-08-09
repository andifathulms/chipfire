import { boardLoad } from '@/lib/engine/load'
import type { Board } from '@/lib/engine/board'
import type { Locale } from '@/lib/i18n'

/**
 * The accumulation, as an instrument reading (PRD §12 — the panel is a
 * seismograph, and a panel with no readings is set dressing).
 *
 * Two numbers, and the distinction between them is the whole point. Load is how
 * full the lattice is against what it can hold at rest; primed is how many cells
 * are one orb from firing. A board can sit at 80% with nothing primed and be
 * calm, or at 40% with six cells primed and be a hair from going off.
 *
 * Neither number says anything about which move to play. That is deliberate —
 * see the note in lib/engine/load.ts.
 */
const COPY = {
  load: { id: 'Muatan', en: 'Load' },
  primed: { id: 'Siap meledak', en: 'Primed' },
  /** Read aloud, because a bar and a bare integer are not a sentence. */
  described: {
    id: (percent: number, primed: number) =>
      `Papan terisi ${percent} persen. ${primed} sel siap meledak.`,
    en: (percent: number, primed: number) =>
      `Board is ${percent} percent full. ${primed} cells one orb from exploding.`,
  },
} as const

export function LoadGauge({ board, locale }: { board: Board; locale: Locale }) {
  const load = boardLoad(board)

  return (
    <div className="flex flex-col gap-2xs">
      <div className="flex items-baseline justify-between gap-md">
        <span className="label-micro">{COPY.load[locale]}</span>
        <span className="font-numeral text-sm text-trace-soft">
          {load.orbs}/{load.capacity}
        </span>
      </div>

      {/*
       * A trace on chart paper: a hairline track with the reading drawn over
       * it, not a progress bar. It fills toward a threshold rather than toward
       * a goal, so it never reads as completion.
       */}
      <div className="flex items-center gap-sm">
        <div
          className="h-1.5 flex-1 border border-trace-hairline bg-chart"
          role="img"
          aria-label={COPY.described[locale](load.percent, load.primed)}
        >
          <div className="h-full bg-trace-data" style={{ width: `${load.percent}%` }} />
        </div>
        <span className="font-numeral text-base leading-flat tabular-nums">{load.percent}%</span>
      </div>

      <div className="flex items-baseline justify-between gap-md">
        <span className="label-micro">{COPY.primed[locale]}</span>
        {/*
         * The same ink as the tremble it counts. A player who has noticed cells
         * shaking should be able to connect the two without being told.
         */}
        <span className="font-numeral text-base leading-flat">{load.primed}</span>
      </div>
    </div>
  )
}
