'use client'

import { NO_OWNER, type Board as EngineBoard } from '@/lib/engine/board'
import { Orbs } from './Orbs'

/**
 * The grid is printed, not drawn: a fixed hairline lattice that exists before
 * the game starts, with cells sitting in it rather than being it (PRD §12).
 *
 * This component renders a position. It computes nothing about the rules.
 */
export type BoardView = {
  readonly owners: Int8Array
  readonly counts: Uint8Array
}

type BoardProps = {
  readonly board: EngineBoard
  readonly view: BoardView
  readonly legal: ReadonlySet<number>
  readonly exploding: readonly number[]
  readonly interactive: boolean
  readonly onSelect: (index: number) => void
  readonly labelFor: (index: number) => string
}

export function Board({
  board,
  view,
  legal,
  exploding,
  interactive,
  onSelect,
  labelFor,
}: BoardProps) {
  const flashing = new Set(exploding)
  const cells: React.ReactNode[] = []

  for (let index = 0; index < view.owners.length; index += 1) {
    const owner = view.owners[index]
    const count = view.counts[index]
    const mass = board.adjacency.criticalMass[index]
    const playable = interactive && legal.has(index)

    // A cell one orb from critical mass trembles — the only ambient motion in
    // the app, and it encodes real danger rather than decoration.
    const critical = count === mass - 1 && owner !== NO_OWNER

    cells.push(
      <button
        key={index}
        type="button"
        disabled={!playable}
        onClick={() => onSelect(index)}
        aria-label={labelFor(index)}
        className={[
          'relative aspect-square border-[0.5px] border-trace/25 p-[12%] transition-colors',
          playable ? 'cursor-pointer hover:bg-chart-deep' : 'cursor-default',
          flashing.has(index) ? 'bg-trace/10' : '',
        ].join(' ')}
      >
        <span className={critical ? 'block h-full w-full animate-tremble' : 'block h-full w-full'}>
          <Orbs player={owner} count={count} />
        </span>
      </button>,
    )
  }

  return (
    <div
      className="grid w-full border-[0.5px] border-trace/40 bg-chart"
      style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
      role="grid"
    >
      {cells}
    </div>
  )
}
