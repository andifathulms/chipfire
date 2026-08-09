import { applyMove } from './apply'
import type { GameEvent } from './events'
import { hashState } from './hash'
import type { PlayerId } from './board'
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

/**
 * One line per move: who played, where, and what it set off.
 *
 * Derived by replay rather than accumulated as the game goes, which is the
 * whole point of the move list being the source of truth — undo, a resync that
 * adopts a peer's history, and loading a shared code all produce a correct
 * summary without anyone maintaining a parallel array that could drift out of
 * step with the moves it describes.
 *
 * `player` comes from the state *before* each move rather than from turn order,
 * because elimination means the sequence is not simply `turn % players`.
 */
export type MoveSummary = {
  /** Cell played into. */
  readonly index: number
  readonly player: PlayerId
  /** Cells that detonated, including the chain. Zero for a quiet move. */
  readonly explosions: number
  /** Cells that changed hands — the reason anyone plays a move like this. */
  readonly captures: number
}

export function summariseMoves(record: GameRecord): MoveSummary[] {
  const frames = replayFrames(record)
  const out: MoveSummary[] = []

  for (let move = 0; move < record.moves.length; move += 1) {
    // frames[0] is the opening position, so the state before move n is at n.
    const before = frames[move]
    const after = frames[move + 1]
    if (before === undefined || after === undefined) break

    let explosions = 0
    let captures = 0
    for (const event of after.events) {
      if (event.type === 'explode') explosions += 1
      // A convert that does not change hands is an orb landing on a cell its
      // owner already held. It is not a capture and must not be counted as one.
      else if (event.type === 'convert' && event.from !== event.to) captures += 1
    }

    out.push({ index: record.moves[move], player: before.state.current, explosions, captures })
  }

  return out
}

export function recordWith(record: GameRecord, index: number): GameRecord {
  return { config: record.config, moves: [...record.moves, index] }
}

/** Hotseat undo: drop the last move and replay. Cheap, and always correct. */
export function undo(record: GameRecord): GameRecord {
  return { config: record.config, moves: record.moves.slice(0, -1) }
}
