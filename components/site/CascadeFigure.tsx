import { Orbs } from '@/components/board/Orbs'
import { copy, type Locale } from '@/lib/i18n'

/**
 * The game, shown rather than described.
 *
 * The landing page was entirely prose: a visitor had to read three sentences
 * about orbs and critical mass before anything on screen suggested a board,
 * and the one thing this game has going for it — a single move sweeping half
 * the grid — was invisible. This is that move, before and after.
 *
 * It is deliberately *not* the live Board component. Board is a client
 * component whose props carry Int8Array/Uint8Array views straight off the
 * engine, and those do not survive the server-component boundary the landing
 * page renders on. Nor should a static picture drag the engine, the cascade
 * player and a roving tabindex into the first paint. This renders literals.
 *
 * Literals lie, though, and this project's whole pitch is that the simulation
 * is exact — so tests/site/cascade-figure.test.ts replays POSITION through the
 * real applyMove and asserts it produces AFTER. Change one and the test names
 * the other.
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

/** `[owner, count]`, owner -1 for empty. Rows in reading order. */
type Cell = readonly [number, number]

const EMPTY: Cell = [-1, 0]

export const FIGURE_BEFORE: readonly Cell[] = [
  [0, 1], [1, 2], EMPTY,  EMPTY,
  [1, 1], [0, 3], [1, 3], EMPTY,
  EMPTY,  [1, 2], [0, 1], EMPTY,
  [0, 1], EMPTY,  EMPTY,  [1, 1],
]

export const FIGURE_AFTER: readonly Cell[] = [
  [0, 1], [0, 1], [0, 2], EMPTY,
  EMPTY,  [0, 3], EMPTY,  [0, 1],
  [0, 1], [0, 3], [0, 2], EMPTY,
  [0, 1], EMPTY,  EMPTY,  [1, 1],
]

/**
 * Registration marks on the cell the move went into. The same figure the board
 * itself uses to mark the last move, so the vocabulary is learned here and
 * recognised there.
 */
function Played() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute inset-0 h-full w-full text-trace">
      <path
        d="M2 7.5V2h5.5M16.5 2H22v5.5M22 16.5V22h-5.5M7.5 22H2v-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function Panel({ cells, played }: { cells: readonly Cell[]; played?: number }) {
  return (
    <div
      className="grid w-full border-[0.5px] border-trace/40 bg-chart"
      style={{ gridTemplateColumns: `repeat(${FIGURE_COLS}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => (
        <div key={index} className="relative aspect-square border-[0.5px] border-trace/25 p-[12%]">
          <Orbs player={cell[0]} count={cell[1]} />
          {played === index ? <Played /> : null}
        </div>
      ))}
    </div>
  )
}

export function CascadeFigure({ locale }: { locale: Locale }) {
  const t = copy(locale)

  return (
    /*
     * A figure, not decoration — it carries the caption that names what the
     * two panels are, and the caption is the alternative for anyone who cannot
     * see them. The panels themselves are aria-hidden through Orbs, so a
     * screen reader gets the sentence rather than thirty-two empty cells.
     */
    <figure className="flex flex-col gap-sm">
      <div className="flex items-center gap-sm sm:gap-md">
        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          <span className="label-micro">{t.figureBefore}</span>
          <Panel cells={FIGURE_BEFORE} played={FIGURE_MOVE} />
        </div>

        {/* The arrow is the verb. Rotated upright on a phone, where the panels
            stay side by side but the gap between them is narrow. */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="mt-lg h-5 w-5 shrink-0 text-trace-faint"
        >
          <path
            d="M3 12h18m0 0-6.5-6.5M21 12l-6.5 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          <span className="label-micro">{t.figureAfter}</span>
          <Panel cells={FIGURE_AFTER} />
        </div>
      </div>

      <figcaption className="max-w-measure text-sm text-trace-soft">{t.figureCaption}</figcaption>
    </figure>
  )
}
