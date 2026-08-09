import { EMPTY_CELL, MiniBoard, type MiniCell } from '@/components/board/MiniBoard'
import { copy, type Locale } from '@/lib/i18n'

/**
 * The game, worked through rather than performed.
 *
 * This was two panels — before, after — captioned "five explosions later, blue
 * is down to a single cell". Inputs and an answer with the working removed,
 * which is a magic trick, and it sat at the exact moment a newcomer is deciding
 * whether any of this is followable. The chain is the thing the app exists to
 * make visible; showing only its endpoints hid it on the front page.
 *
 * A middle panel now carries the part that was missing: the cascade caught
 * between generations, with the cells that are about to fire outlined. Three
 * panels is the smallest number that can show a process rather than a result.
 *
 * It is deliberately *not* the live Board — see MiniBoard — and every position
 * here is asserted against the real engine in tests/site, so the picture cannot
 * drift into showing a game these rules do not produce.
 */

/** Board notation for the position below, in the same dialect the rules
 *  fixtures and the tutorial use. A = player 0 (orange), B = player 1 (blue). */
export const FIGURE_POSITION = {
  board: `
    A1 B2 .  .
    B1 A3 B3 .
    .  B2 A1 .
    A1 .  .  B1
  `,
  players: 2,
  current: 0,
} as const

/** Orange plays into its own cell at row 1, column 1 — already at three orbs,
 *  one short of the four an interior cell holds. */
export const FIGURE_MOVE = 5

export const FIGURE_COLS = 4

/** The frame the middle panel draws: two generations in, mid-chain. */
export const FIGURE_MIDWAY_FRAME = 2

export const FIGURE_BEFORE: readonly MiniCell[] = [
  [0, 1], [1, 2], EMPTY_CELL, EMPTY_CELL,
  [1, 1], [0, 3], [1, 3], EMPTY_CELL,
  EMPTY_CELL, [1, 2], [0, 1], EMPTY_CELL,
  [0, 1], EMPTY_CELL, EMPTY_CELL, [1, 1],
]

/**
 * Two generations in. Orange has taken most of the board already, and the
 * outlined corner is holding 2 against a limit of 2 — so it is the next to go.
 * The cell below it holds 3, which looks similar and is not over: an interior
 * cell has four neighbours and so a limit of 4. That contrast is the reason
 * this frame is the one worth showing.
 */
export const FIGURE_MIDWAY: readonly MiniCell[] = [
  [0, 2], EMPTY_CELL, [0, 2], EMPTY_CELL,
  [0, 2], [0, 2], EMPTY_CELL, [0, 1],
  EMPTY_CELL, [0, 3], [0, 2], EMPTY_CELL,
  [0, 1], EMPTY_CELL, EMPTY_CELL, [1, 1],
]

/** Cells above their limit in the midway frame, so about to fire. */
export const FIGURE_MIDWAY_FIRING: readonly number[] = [0]

export const FIGURE_AFTER: readonly MiniCell[] = [
  [0, 1], [0, 1], [0, 2], EMPTY_CELL,
  EMPTY_CELL, [0, 3], EMPTY_CELL, [0, 1],
  [0, 1], [0, 3], [0, 2], EMPTY_CELL,
  [0, 1], EMPTY_CELL, EMPTY_CELL, [1, 1],
]

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-lg h-4 w-4 shrink-0 text-trace-faint">
      <path d="M3 12h18m0 0-6.5-6.5M21 12l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  )
}

export function CascadeFigure({ locale }: { locale: Locale }) {
  const t = copy(locale)

  return (
    /*
     * A figure with a caption that carries the arithmetic, because the caption
     * is also the alternative for anyone who cannot see the panels — the boards
     * themselves are aria-hidden through Orbs.
     */
    <figure className="flex flex-col gap-sm">
      <div className="flex items-start gap-2xs sm:gap-xs">
        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          <span className="label-micro">{t.figureBefore}</span>
          <MiniBoard cells={FIGURE_BEFORE} cols={FIGURE_COLS} played={FIGURE_MOVE} />
        </div>

        <Arrow />

        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          <span className="label-micro">{t.figureDuring}</span>
          <MiniBoard
            cells={FIGURE_MIDWAY}
            cols={FIGURE_COLS}
            firing={FIGURE_MIDWAY_FIRING}
          />
        </div>

        <Arrow />

        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          <span className="label-micro">{t.figureAfter}</span>
          <MiniBoard cells={FIGURE_AFTER} cols={FIGURE_COLS} />
        </div>
      </div>

      <figcaption className="max-w-measure text-sm text-trace-soft">{t.figureCaption}</figcaption>
    </figure>
  )
}
