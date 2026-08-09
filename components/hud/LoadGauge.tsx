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
  /** What the denominator is, next to the denominator. It is the sum of every
   *  cell's limit minus one — the most orbs the board can hold with nothing
   *  going off — and without saying so the ratio is two numbers and a slash. */
  basis: {
    id: (capacity: number) =>
      `${capacity} adalah muatan maksimum papan ini sebelum ada yang meledak: jumlah dari (batas − 1) tiap sel.`,
    en: (capacity: number) =>
      `${capacity} is the most this board can hold with nothing going off: every cell's limit minus one, summed.`,
  },
  /** Honest about the one case the reading breaks. */
  overflow: {
    id: 'Di atas 100% karena permainan sudah selesai — rantai berhenti begitu satu pemain menguasai semuanya, jadi ada sel yang masih melewati batas.',
    en: 'Over 100% because the game is already decided — the chain halts the moment one player owns everything, so some cells are still above their limit.',
  },
  primedBasis: {
    id: 'Sel yang tinggal satu orb lagi meledak. Sel-sel inilah yang bergetar di papan.',
    en: 'Cells one orb short of firing. These are the ones trembling on the board.',
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
        {/*
         * Hidden rather than labelled. It carried role="img" and a sentence
         * restating the percentage and the primed count — both printed beside
         * it as text — so a screen reader read the same two facts twice. A
         * drawing of numbers that are already there is decorative, and the fix
         * for over-labelling is to delete the label, not to reword it.
         */}
        <div aria-hidden="true" className="h-1.5 flex-1 border border-trace-hairline bg-chart">
          <div className="h-full bg-trace-data" style={{ width: `${load.percent}%` }} />
        </div>
        <span className="font-numeral text-base leading-flat tabular-nums">{load.percent}%</span>
      </div>

      <p className="text-xs leading-snug text-trace-faint">
        {load.percent > 100 ? COPY.overflow[locale] : COPY.basis[locale](load.capacity)}
      </p>

      <div className="flex items-baseline justify-between gap-md">
        <span className="label-micro">{COPY.primed[locale]}</span>
        {/*
         * The same ink as the tremble it counts. A player who has noticed cells
         * shaking should be able to connect the two without being told.
         */}
        <span className="font-numeral text-base leading-flat">{load.primed}</span>
      </div>

      <p className="text-xs leading-snug text-trace-faint">{COPY.primedBasis[locale]}</p>
    </div>
  )
}
