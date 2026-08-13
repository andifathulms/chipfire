import type { GameEvent } from '@/lib/engine/events'
import type { Board } from '@/lib/engine/board'

/**
 * The event stream becomes animation frames here, and nowhere else.
 *
 * The renderer never decides what happened — it replays what the engine
 * already decided. One frame per cascade generation, so simultaneous
 * explosions read as one wave and a long chain reads as a chain (PRD §9.1).
 */

export type Frame = {
  readonly owners: Int8Array
  readonly counts: Uint8Array
  /** Cells that detonated in this frame. Drives the flash, nothing else. */
  readonly exploding: readonly number[]
  /** Cells that changed hands in this frame. */
  readonly converted: readonly number[]
}

type Mutable = { owners: Int8Array; counts: Uint8Array }

function snapshot(cells: Mutable, exploding: number[], converted: number[]): Frame {
  return {
    owners: Int8Array.from(cells.owners),
    counts: Uint8Array.from(cells.counts),
    exploding,
    converted,
  }
}

/**
 * `base` is the board *before* the move. The returned frames start with the
 * placement and end at the resolved position.
 */
export function buildFrames(base: Board, events: readonly GameEvent[]): Frame[] {
  const cells: Mutable = {
    owners: Int8Array.from(base.owners),
    counts: Uint8Array.from(base.counts),
  }

  const frames: Frame[] = []
  let currentStep = -1
  let exploding: number[] = []
  let converted: number[] = []

  const flush = () => {
    if (currentStep === -1) return
    frames.push(snapshot(cells, exploding, converted))
    exploding = []
    converted = []
  }

  for (const event of events) {
    switch (event.type) {
      case 'place':
        cells.owners[event.index] = event.player
        cells.counts[event.index] = event.count
        frames.push(snapshot(cells, [], []))
        break

      case 'explode':
        if (event.step !== currentStep) {
          flush()
          currentStep = event.step
        }
        cells.counts[event.index] -= base.adjacency.criticalMass[event.index]
        if (cells.counts[event.index] === 0) cells.owners[event.index] = -1
        exploding.push(event.index)
        break

      case 'convert':
        cells.owners[event.index] = event.to
        cells.counts[event.index] = event.count
        if (event.from !== event.to) converted.push(event.index)
        break

      // Elimination and victory are HUD concerns, not board frames.
      case 'eliminate':
      case 'win':
        break

      default: {
        const exhaustive: never = event
        throw new Error(`unhandled event: ${JSON.stringify(exhaustive)}`)
      }
    }
  }

  flush()
  return frames
}

/**
 * Where the last cascade went, and how deep into it each cell was.
 *
 * The event stream has always carried `step` — the generation a cell fired in —
 * and the renderer used it to pace the animation and then discarded it. Once
 * the board settled, the shape of what had just happened was gone: forty cells
 * detonate, the dust clears, and the position gives no account of how it got
 * there.
 *
 * This keeps it. One value per cell, the last generation in which it fired, so
 * the trace can be drawn brightest where the fire reached last. A cell can go
 * off more than once in a chain, and the most recent time is the one that
 * should show.
 *
 * Derived from events rather than frames because the generation is a fact the
 * engine states, not something the frame builder happens to preserve.
 */
export type Afterglow = {
  /** Generation + 1 per cell; 0 means it never fired. */
  readonly cells: Uint8Array
  /** Generations in the chain, for scaling intensity. At least 1. */
  readonly depth: number
}

export function buildAfterglow(size: number, events: readonly GameEvent[]): Afterglow | null {
  const cells = new Uint8Array(size)
  let depth = 0
  let any = false

  for (const event of events) {
    if (event.type !== 'explode') continue
    any = true
    // +1 so that "fired in generation 0" is distinguishable from "never fired".
    const generation = Math.min(255, event.step + 1)
    if (generation > cells[event.index]) cells[event.index] = generation
    if (event.step + 1 > depth) depth = event.step + 1
  }

  return any ? { cells, depth: Math.max(1, depth) } : null
}
