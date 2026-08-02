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
