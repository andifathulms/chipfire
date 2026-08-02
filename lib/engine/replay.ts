import { applyMove } from './apply'
import type { GameEvent } from './events'
import { hashState } from './hash'
import { createGame, type GameConfig, type GameState, type Move } from './state'

/**
 * A game is its move list (PRD §6). State is always reconstructible by replay
 * from the seed, which is what gives replay, hotseat undo, desync recovery, and
 * shareable games from one property.
 *
 * Derived state is never the source of truth and never crosses the wire.
 */

export type GameRecord = {
  readonly config: GameConfig
  /** Cell indices in play order. The player is implied by the turn sequence. */
  readonly moves: readonly number[]
}

export type ReplayFrame = {
  readonly state: GameState
  readonly events: readonly GameEvent[]
  readonly hash: string
}

export function toMove(state: GameState, index: number): Move {
  return { type: 'place', player: state.current, index }
}

/** Replay a record to its final state. */
export function replay(record: GameRecord): GameState {
  let state = createGame(record.config)
  for (const index of record.moves) {
    state = applyMove(state, toMove(state, index)).state
  }
  return state
}

/**
 * Every intermediate position, including the initial one, with its hash.
 * The replay viewer steps through these; the sync layer compares hashes.
 */
export function replayFrames(record: GameRecord): ReplayFrame[] {
  let state = createGame(record.config)
  const frames: ReplayFrame[] = [{ state, events: [], hash: hashState(state) }]

  for (const index of record.moves) {
    const result = applyMove(state, toMove(state, index))
    state = result.state
    frames.push({ state, events: result.events, hash: hashState(state) })
  }

  return frames
}

/** Hash after every turn — the cross-instance agreement corpus. */
export function replayHashes(record: GameRecord): string[] {
  return replayFrames(record).map((frame) => frame.hash)
}

export function recordWith(record: GameRecord, index: number): GameRecord {
  return { config: record.config, moves: [...record.moves, index] }
}

/** Hotseat undo: drop the last move and replay. Cheap, and always correct. */
export function undo(record: GameRecord): GameRecord {
  return { config: record.config, moves: record.moves.slice(0, -1) }
}
