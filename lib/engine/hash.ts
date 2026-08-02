import type { GameState } from './state'

/**
 * Deterministic state hash — the P2P sync guarantee.
 *
 * Peers exchange this every turn and halt on mismatch. It must therefore walk
 * the state in a fixed positional order and touch every byte that can diverge:
 * a hash that ignores a field turns a desync into a silent one, which is the
 * worst failure this project can produce (PRD §7).
 *
 * FNV-1a, 32-bit, integer only. `Math.imul` keeps the multiply exact in 32 bits
 * on every engine.
 */

const OFFSET_BASIS = 0x811c9dc5
const PRIME = 0x01000193

function mix(hash: number, byte: number): number {
  return Math.imul(hash ^ (byte & 0xff), PRIME) >>> 0
}

function mixInt32(hash: number, value: number): number {
  let out = hash
  out = mix(out, value)
  out = mix(out, value >>> 8)
  out = mix(out, value >>> 16)
  out = mix(out, value >>> 24)
  return out
}

export function hashState(state: GameState): string {
  let hash = OFFSET_BASIS

  hash = mixInt32(hash, state.board.rows)
  hash = mixInt32(hash, state.board.cols)
  hash = mixInt32(hash, state.players)
  hash = mixInt32(hash, state.current)
  hash = mixInt32(hash, state.turn)
  hash = mixInt32(hash, state.seed)
  hash = mixInt32(hash, state.winner === null ? -1 : state.winner)

  const { owners, counts } = state.board
  for (let index = 0; index < owners.length; index += 1) {
    hash = mix(hash, owners[index])
    hash = mix(hash, counts[index])
  }

  for (let player = 0; player < state.players; player += 1) {
    hash = mixInt32(hash, state.orbs[player])
    hash = mix(hash, state.hasMoved[player])
    hash = mix(hash, state.eliminated[player])
  }

  return hash.toString(16).padStart(8, '0')
}

/** Hash a move list, so peers can confirm they share the same history. */
export function hashMoves(moves: readonly { player: number; index: number }[]): string {
  let hash = OFFSET_BASIS
  for (const move of moves) {
    hash = mixInt32(hash, move.player)
    hash = mixInt32(hash, move.index)
  }
  return hash.toString(16).padStart(8, '0')
}
