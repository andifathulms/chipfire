import { cascadeDepth, type GameEvent } from './engine/events'
import type { PlayerId } from './engine/board'

/**
 * DESIGN-REWORK.md §3: four phases, derived from state — never stored, never
 * decided by a renderer. `CLAUDE.md` invariant 15 says the renderer only
 * draws what happened; this is computed here for the same reason the move
 * list and the load reading are computed in `lib/` rather than a component.
 */
export type Phase = 'siap' | 'main' | 'longsor' | 'selesai'

export type PhaseInput = {
  /** `record.moves.length` — zero means nothing has been played yet. */
  readonly movesPlayed: number
  readonly winner: PlayerId | null
  /**
   * The events of the cascade the most recently played move produced, or
   * `null` before any move exists. `useGameSession`'s `lastCascade` already
   * holds exactly this — the cascade from the last move, cleared only by
   * `reset`/`undo`/`load` — so passing it straight through is what makes
   * `longsor` demote on the next move without any extra bookkeeping here.
   */
  readonly lastCascadeEvents: readonly GameEvent[] | null
  /**
   * `false` in `tanding`: an incoming peer move would interrupt a re-watch,
   * so the phase does not exist there (`CLAUDE.md`, `DESIGN-REWORK.md` §3).
   * Defaults to `true` for hotseat/AI play.
   */
  readonly supportsLongsor?: boolean
}

/**
 * A cascade of more than one generation, immediately after it resolved. A
 * single-orb placement that triggers nothing — `cascadeDepth` of zero or one
 * — never enters this phase, per DESIGN-REWORK.md §3.
 */
const LONGSOR_MIN_DEPTH = 2

export function derivePhase(input: PhaseInput): Phase {
  const { movesPlayed, winner, lastCascadeEvents, supportsLongsor = true } = input

  if (winner !== null) return 'selesai'
  if (movesPlayed === 0) return 'siap'
  if (
    supportsLongsor &&
    lastCascadeEvents !== null &&
    cascadeDepth(lastCascadeEvents) >= LONGSOR_MIN_DEPTH
  ) {
    return 'longsor'
  }
  return 'main'
}
