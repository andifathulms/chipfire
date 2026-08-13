'use client'

import { useEffect, useRef, useState } from 'react'
import { NO_OWNER, type Board as EngineBoard } from '@/lib/engine/board'
import type { Afterglow } from '@/components/cascade/frames'
import { useReducedMotion } from '@/components/cascade/useCascadePlayer'
import type { MovePreview } from '@/lib/engine/preview'
import { styleFor } from '@/lib/players'
import { Orbs } from './Orbs'

/**
 * A generation's explosions are simultaneous in the rules, but drawn as a
 * ripple outward from where the move was played — the burst keyframe already
 * scales past the cell edge so that *successive frames* overlap into one
 * wave; this makes the cells *within* a frame do the same. Distance is plain
 * Manhattan distance over the orthogonal grid, not a rules computation, and
 * the delay is capped so a chain that reaches across the whole board never
 * pushes a single generation past a quarter second.
 */
const RIPPLE_STEP_MS = 22
const RIPPLE_MAX_STEPS = 6

function rippleDelay(index: number, origin: number | null, cols: number): number {
  if (origin === null) return 0
  const dRow = Math.floor(index / cols) - Math.floor(origin / cols)
  const dCol = (index % cols) - (origin % cols)
  const distance = Math.abs(dRow) + Math.abs(dCol)
  return Math.min(distance, RIPPLE_MAX_STEPS) * RIPPLE_STEP_MS
}

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
  /** Cells that changed hands in this frame. The engine has always reported
   *  these; until now the renderer discarded them. */
  readonly converted?: readonly number[]
  /**
   * Changes once per animation frame. React reuses the cell elements across
   * frames, so without a key that changes, a CSS animation set on the first
   * frame never replays on the next one and a cascade animates exactly once.
   */
  readonly frameKey?: number
  readonly interactive: boolean
  /** `viaTouch` lets the caller demand a confirming second tap where there is
   *  no hover to preview with. */
  readonly onSelect: (index: number, viaTouch: boolean) => void
  readonly labelFor: (index: number) => string
  /** Cells the hovered move would reach. Null when nothing is being considered. */
  readonly preview?: MovePreview | null
  readonly previewIndex?: number | null
  readonly onPreview?: (index: number | null) => void
  /** Outline the playable cells. Useful where only a few cells are offered —
   *  in a real game every empty cell is legal, so marking them all is noise. */
  readonly markLegal?: boolean
  /** Names the board for screen readers, since it is a group of buttons. */
  readonly label?: string
  /**
   * The cell the most recent move was played into, marked until the next move
   * replaces it. Without this an opponent's move is unreadable: their orb
   * simply joins fifty others and whatever it sets off appears to come from
   * nowhere. You know where you clicked; you have no idea where they did.
   */
  readonly lastMove?: number | null
  /**
   * Where the last cascade went. Null while one is playing — the burst is
   * already saying it — and again once there is nothing to remember.
   */
  readonly afterglow?: Afterglow | null
}

export function Board({
  board,
  view,
  legal,
  exploding,
  converted = [],
  frameKey = 0,
  interactive,
  onSelect,
  labelFor,
  preview = null,
  previewIndex = null,
  onPreview,
  markLegal = false,
  label,
  lastMove = null,
  afterglow = null,
}: BoardProps) {
  // Touch has no hover, so a tap previews and a second tap commits.
  const touchRef = useRef(false)
  // A staggered ripple reads as a wave; a real-time pause before a
  // near-instant flash reads as lag. Reduced motion gets neither.
  const reduced = useReducedMotion()
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const flashing = new Set(exploding)
  const claimed = new Set(converted)
  const cells: React.ReactNode[] = []
  const size = view.owners.length

  /*
   * Roving tabindex. Without it a 6×9 board puts fifty-four tab stops between
   * the keyboard user and the controls below it; with it the board is a single
   * stop and the arrow keys walk the lattice, which is how a grid should behave.
   */
  const [cursor, setCursor] = useState(0)

  // A new, smaller board must not leave the cursor pointing off the end.
  useEffect(() => {
    setCursor((current) => (current < size ? current : 0))
  }, [size])

  const moveCursor = (next: number) => {
    if (next < 0 || next >= size) return
    setCursor(next)
    cellRefs.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const row = Math.floor(index / board.cols)
    const col = index % board.cols

    // Clamped at the edges rather than wrapping: on a board where corners and
    // edges have different critical mass, silently teleporting across the
    // lattice would misrepresent the geometry the player is reasoning about.
    switch (event.key) {
      case 'ArrowRight':
        if (col < board.cols - 1) moveCursor(index + 1)
        break
      case 'ArrowLeft':
        if (col > 0) moveCursor(index - 1)
        break
      case 'ArrowDown':
        if (row < board.rows - 1) moveCursor(index + board.cols)
        break
      case 'ArrowUp':
        if (row > 0) moveCursor(index - board.cols)
        break
      case 'Home':
        moveCursor(row * board.cols)
        break
      case 'End':
        moveCursor(row * board.cols + board.cols - 1)
        break
      default:
        return
    }
    event.preventDefault()
  }

  for (let index = 0; index < size; index += 1) {
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
    const delay = reduced ? 0 : rippleDelay(index, lastMove, board.cols)

    cells.push(
      <button
        key={index}
        ref={(node) => {
          cellRefs.current[index] = node
        }}
        type="button"
        /*
         * `aria-disabled` rather than `disabled`: an unplayable cell is still
         * worth reading. Disabling it drops it out of the tab order entirely,
         * so a screen-reader user could never inspect the opponent's position —
         * information this game hides from nobody.
         */
        aria-disabled={!playable}
        tabIndex={cursor === index ? 0 : -1}
        onKeyDown={(event) => onKeyDown(event, index)}
        onClick={(event) => {
          if (!playable) return
          onSelect(index, event.nativeEvent.detail === 0 ? false : touchRef.current)
        }}
        onPointerDown={(event) => {
          touchRef.current = event.pointerType === 'touch'
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'touch' || !playable) return
          onPreview?.(index)
        }}
        onPointerLeave={() => onPreview?.(null)}
        onFocus={() => {
          setCursor(index)
          if (playable) onPreview?.(index)
        }}
        onBlur={() => onPreview?.(null)}
        aria-label={labelFor(index)}
        className={[
          // `transition-colors` doesn't reach outline-color, so the legal-move
          // and captured-cell rings used to snap in a beat after the wash
          // they sit beside had already eased.
          'relative aspect-square border-[0.5px] border-trace/25 p-[12%] transition-[background-color,outline-color]',
          playable ? 'cursor-pointer hover:bg-chart-deep' : 'cursor-default',
          flashing.has(index) ? 'bg-trace/10' : '',
          // The reach of the move under consideration, drawn on the lattice
          // itself rather than as a floating overlay.
          origin ? 'bg-trace/10' : touched ? 'bg-trace/[0.06]' : '',
          captured ? 'outline outline-1 -outline-offset-1 outline-trace/50' : '',
          markLegal && playable
            ? 'outline outline-1 outline-dashed -outline-offset-2 outline-trace/45'
            : '',
        ].join(' ')}
      >
        {/*
         * The trace of the last cascade, under everything else in the cell.
         * Brightest where the fire reached last, which is the one thing the
         * board never said once the dust settled: the position told you what
         * happened and nothing about how it got there.
         */}
        {afterglow !== null && afterglow.cells[index] > 0 ? (
          <span
            aria-hidden="true"
            className="glow pointer-events-none absolute inset-0"
            style={
              {
                '--t': (afterglow.cells[index] - 1) / afterglow.depth,
              } as React.CSSProperties
            }
          />
        ) : null}

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

        {/*
         * Capture, in the colour of whoever just took the cell. The engine has
         * always reported which cells changed hands; the renderer discarded it,
         * so the one thing a cascade is *for* went unmarked while the cells
         * that merely detonated got a flash.
         */}
        {claimed.has(index) && owner !== NO_OWNER ? (
          <span
            key={`claim-${frameKey}`}
            aria-hidden="true"
            style={{ animationDelay: `${delay}ms` }}
            className={`pointer-events-none absolute inset-0 animate-claim ${styleFor(owner).fill}`}
          />
        ) : null}

        {/* The release. Scaled past the cell edge so consecutive generations
            overlap into one wave rather than a row of blinks; the delay does
            the same within a single generation, rippling outward from the
            move that started it. */}
        {flashing.has(index) ? (
          <span
            key={`burst-${frameKey}`}
            aria-hidden="true"
            style={{ animationDelay: `${delay}ms` }}
            className="pointer-events-none absolute inset-0 animate-burst border border-trace"
          />
        ) : null}

        <span className={critical ? 'block h-full w-full animate-tremble' : 'block h-full w-full'}>
          {/* Keyed on the contents, so orbs animate when the cell actually
              changes and stay still when a neighbouring preview redraws it. */}
          <span key={`${owner}:${count}`} className="block h-full w-full animate-arrive">
            <Orbs player={owner} count={count} />
          </span>
        </span>

        {/*
         * Where the last move was played. Registration marks rather than a
         * ring or a tint: the corners stay clear of the orbs, they read as an
         * instrument marking a reading rather than as another game state, and
         * they cannot be confused with the preview outlines, which are all
         * part-strength and only exist while a pointer is down on the board.
         *
         * Drawn last so it sits above the orbs, and keyed on the index so it
         * animates in each time the mark moves — that flick is what pulls the
         * eye to the cell the opponent just took.
         */}
        {lastMove === index ? (
          <svg
            key={`played-${index}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full animate-arrive text-trace"
          >
            <path
              d="M2 7.5V2h5.5M16.5 2H22v5.5M22 16.5V22h-5.5M7.5 22H2v-5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
      </button>,
    )
  }

  return (
    <div
      className="grid w-full border-[0.5px] border-trace/40 bg-chart"
      style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
      role="group"
      aria-label={label}
      onPointerLeave={() => onPreview?.(null)}
    >
      {cells}
    </div>
  )
}
