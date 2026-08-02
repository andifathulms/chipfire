import { NO_OWNER } from './board'
import { findSoleSurvivor, resolveCascade } from './cascade'
import type { GameEvent } from './events'
import { cloneState, isLegalMove, nextPlayer, type GameState, type Move } from './state'

/**
 * `applyMove(state, move) → { state, events }` is the function everything else
 * in this project rests on: replay, undo, AI search, and peer sync.
 *
 * It is pure and deterministic. No clock, no `Date`, no `Math.random`, no
 * floats, no module-level mutable state, no iteration over unordered
 * collections. Same state plus same move yields byte-identical results on any
 * device, any browser, any time.
 */

export class IllegalMoveError extends Error {
  constructor(readonly move: Move) {
    super(`illegal move: player ${move.player} @ ${move.index}`)
    this.name = 'IllegalMoveError'
  }
}

export type MoveResult = {
  readonly state: GameState
  readonly events: readonly GameEvent[]
}

export function applyMove(state: GameState, move: Move): MoveResult {
  if (!isLegalMove(state, move)) throw new IllegalMoveError(move)

  const next = cloneState(state)
  const events: GameEvent[] = []
  const { owners, counts } = next.board

  // Placement: one orb, ownership to the mover.
  const count = counts[move.index] + 1
  counts[move.index] = count
  owners[move.index] = move.player
  next.orbs[move.player] += 1
  next.hasMoved[move.player] = 1
  events.push({ type: 'place', index: move.index, player: move.player, count })

  const cascadeWinner = resolveCascade(next, move.index, events)

  // Elimination applies only to players who have already taken a turn.
  for (let player = 0; player < next.players; player += 1) {
    if (next.eliminated[player] === 1) continue
    if (next.hasMoved[player] === 0) continue
    if (next.orbs[player] > 0) continue
    next.eliminated[player] = 1
    events.push({ type: 'eliminate', player })
  }

  const winner = cascadeWinner ?? findSoleSurvivor(next)
  if (winner !== null) {
    events.push({ type: 'win', player: winner })
    return {
      state: {
        ...next,
        winner,
        turn: next.turn + 1,
        current: winner,
      },
      events,
    }
  }

  return {
    state: {
      ...next,
      turn: next.turn + 1,
      current: nextPlayer(next, move.player),
    },
    events,
  }
}

/** Convenience for callers that only need the resulting state. */
export function applyMoves(state: GameState, moves: readonly Move[]): GameState {
  let current = state
  for (const move of moves) current = applyMove(current, move).state
  return current
}

/** True when the cell holds orbs at all. Used by the UI and the evaluation. */
export function isOccupied(state: GameState, index: number): boolean {
  return state.board.owners[index] !== NO_OWNER
}
