import { styleFor } from '@/lib/players'
import { Orbs } from './Orbs'

/**
 * A board position as a picture, with nothing behind it.
 *
 * The real Board is a client component carrying the engine's typed arrays, a
 * roving tabindex and a preview. Nowhere that wants to *illustrate* a position
 * needs any of that — the landing figure, a cascade shown a generation at a
 * time, a move that was not played — and several of those places render on the
 * server, which the typed arrays cannot cross.
 *
 * Cells are `[owner, count]`, owner -1 for empty, in reading order.
 */
export type MiniCell = readonly [number, number]

export const EMPTY_CELL: MiniCell = [-1, 0]

/**
 * Registration marks, the same figure the live board uses to mark the last
 * move. Learned here, recognised there.
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

export function MiniBoard({
  cells,
  cols,
  played,
  /** Cells detonating in this frame, outlined so a mid-cascade picture says
   *  which cells are about to go rather than leaving it to be inferred. */
  firing = [],
}: {
  cells: readonly MiniCell[]
  cols: number
  played?: number
  firing?: readonly number[]
}) {
  const alight = new Set(firing)

  return (
    <div
      className="grid w-full gap-[2px] rounded-panel bg-bezel p-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => (
        <div
          key={index}
          className={[
            'relative aspect-square rounded-[4px] bg-well p-[8%]',
            alight.has(index) ? 'ring-2 ring-inset ring-trace/50' : '',
          ].join(' ')}
        >
          {/* The same territory wash the live board draws. */}
          {cell[0] >= 0 ? (
            <span
              aria-hidden="true"
              className={`absolute inset-0 rounded-[4px] ${styleFor(cell[0]).tint}`}
            />
          ) : null}
          <span className="relative block h-full w-full">
            <Orbs player={cell[0]} count={cell[1]} />
          </span>
          {played === index ? <Played /> : null}
        </div>
      ))}
    </div>
  )
}
