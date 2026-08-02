import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  NO_OWNER,
  boardSize,
  cloneBoard,
  createBoard,
  type Board,
  type PlayerId,
  DEFAULT_COLS,
  DEFAULT_ROWS,
} from './board'
import { normaliseSeed, type Seed } from './prng'

export type Move = {
  readonly type: 'place'
  readonly player: PlayerId
  readonly index: number
}

export type GameConfig = {
  readonly rows: number
  readonly cols: number
  readonly players: number
  readonly seed: Seed
}

export type GameState = {
  readonly board: Board
  readonly players: number
  readonly current: PlayerId
  /** Moves applied so far. Also drives the elimination guard. */
  readonly turn: number
  readonly seed: Seed
  /** Orbs owned per player. Maintained incrementally so the victory check inside
   *  the cascade loop stays O(players) rather than O(cells). */
  readonly orbs: Int32Array
  /** 1 once a player has taken a turn — elimination does not apply before that. */
  readonly hasMoved: Uint8Array
  readonly eliminated: Uint8Array
  readonly winner: PlayerId | null
}

export const DEFAULT_CONFIG: GameConfig = {
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  players: 2,
  seed: 1,
}

export function createGame(config: Partial<GameConfig> = {}): GameState {
  const merged: GameConfig = { ...DEFAULT_CONFIG, ...config }
  if (
    !Number.isInteger(merged.players) ||
    merged.players < MIN_PLAYERS ||
    merged.players > MAX_PLAYERS
  ) {
    throw new Error(`players out of bounds: ${merged.players}`)
  }

  return {
    board: createBoard(merged.rows, merged.cols),
    players: merged.players,
    current: 0,
    turn: 0,
    seed: normaliseSeed(merged.seed),
    orbs: new Int32Array(merged.players),
    hasMoved: new Uint8Array(merged.players),
    eliminated: new Uint8Array(merged.players),
    winner: null,
  }
}

/** Mutable working copy for the cascade. Never handed out. */
export function cloneState(state: GameState): GameState {
  return {
    board: cloneBoard(state.board),
    players: state.players,
    current: state.current,
    turn: state.turn,
    seed: state.seed,
    orbs: Int32Array.from(state.orbs),
    hasMoved: Uint8Array.from(state.hasMoved),
    eliminated: Uint8Array.from(state.eliminated),
    winner: state.winner,
  }
}

export function isGameOver(state: GameState): boolean {
  return state.winner !== null
}

export function isLegalMove(state: GameState, move: Move): boolean {
  if (state.winner !== null) return false
  if (move.type !== 'place') return false
  if (move.player !== state.current) return false
  if (!Number.isInteger(move.index)) return false
  if (move.index < 0 || move.index >= boardSize(state.board)) return false
  if (state.eliminated[move.player] === 1) return false

  const owner = state.board.owners[move.index]
  return owner === NO_OWNER || owner === move.player
}

/** Legal cells for the player to move, in ascending index order. */
export function legalMoves(state: GameState): number[] {
  const out: number[] = []
  if (state.winner !== null) return out

  const { owners } = state.board
  const player = state.current
  for (let index = 0; index < owners.length; index += 1) {
    const owner = owners[index]
    if (owner === NO_OWNER || owner === player) out.push(index)
  }
  return out
}

/**
 * The next player still in the game, scanning upward from `from`.
 * Returns `from` itself if nobody else remains.
 */
export function nextPlayer(state: GameState, from: PlayerId): PlayerId {
  for (let step = 1; step <= state.players; step += 1) {
    const candidate = (from + step) % state.players
    if (state.eliminated[candidate] === 0) return candidate
  }
  return from
}

export function activePlayers(state: GameState): PlayerId[] {
  const out: PlayerId[] = []
  for (let player = 0; player < state.players; player += 1) {
    if (state.eliminated[player] === 0) out.push(player)
  }
  return out
}
