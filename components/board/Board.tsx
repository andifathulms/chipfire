'use client'

import { useRef } from 'react'
import { NO_OWNER, type Board as EngineBoard } from '@/lib/engine/board'
import type { MovePreview } from '@/lib/engine/preview'
import { Orbs } from './Orbs'

/**
 * The grid is printed, not drawn: a fixed hairline lattice that exists before
 * the game starts, with cells sitting in it rather than being it (PRD §12).
 *
 * This component renders a position. It computes nothing about the rules —
 * including the preview, which arrives already resolved by the engine.
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
  /** `viaTouch` lets the caller demand a confirming second tap where there is
   *  no hover to preview with. */
  readonly onSelect: (index: number, viaTouch: boolean) => void
  readonly labelFor: (index: number) => string
  /** Cells the hovered move would reach. Null when nothing is being considered. */
  readonly preview?: MovePreview | null
  readonly previewIndex?: number | null
  readonly onPreview?: (index: number | null) => void
}

export function Board({
  board,
  view,
  legal,
  exploding,
  interactive,
  onSelect,
  labelFor,
  preview = null,
  previewIndex = null,
  onPreview,
}: BoardProps) {
  // Touch has no hover, so a tap previews and a second tap commits.
  const touchRef = useRef(false)
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

    const touched = preview?.touched[index] === 1
    const captured = preview?.captured[index] === 1
    const origin = previewIndex === index

    cells.push(
      <button
        key={index}
        type="button"
        disabled={!playable}
        onClick={(event) => onSelect(index, event.nativeEvent.detail === 0 ? false : touchRef.current)}
        onPointerDown={(event) => {
          touchRef.current = event.pointerType === 'touch'
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'touch' || !playable) return
          onPreview?.(index)
        }}
        onPointerLeave={() => onPreview?.(null)}
        onFocus={() => (playable ? onPreview?.(index) : undefined)}
        onBlur={() => onPreview?.(null)}
        aria-label={labelFor(index)}
        className={[
          'relative aspect-square border-[0.5px] border-trace/25 p-[12%] transition-colors',
          playable ? 'cursor-pointer hover:bg-chart-deep' : 'cursor-default',
          flashing.has(index) ? 'bg-trace/10' : '',
          // The reach of the move under consideration, drawn on the lattice
          // itself rather than as a floating overlay.
          origin ? 'bg-trace/10' : touched ? 'bg-trace/[0.06]' : '',
          captured ? 'outline outline-1 -outline-offset-1 outline-trace/50' : '',
        ].join(' ')}
      >
        {/* Capacity ticks: how many orbs this cell holds before it goes. The
            rule that critical mass differs by position is otherwise invisible. */}
        {count === 0 && !flashing.has(index) ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[3px] opacity-25"
          >
            {Array.from({ length: mass }, (_, tick) => (
              <span key={tick} className="h-[3px] w-[3px] rounded-full bg-trace" />
            ))}
          </span>
        ) : null}

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
      onPointerLeave={() => onPreview?.(null)}
    >
      {cells}
    </div>
  )
}
