import { NO_OWNER } from '@/lib/engine/board'
import type { GameState } from '@/lib/engine/state'

/**
 * Hand-written and inspectable — no ML, nothing hidden (PRD §8).
 *
 * Integer weights only. A float here would be a determinism hazard the moment
 * an evaluation ever influenced anything the peers compare.
 */
export const WEIGHTS = {
  /** Material: orbs are cheap, cells are what you actually hold. */
  orb: 2,
  cell: 6,
  /** Low critical mass is powerful: corners detonate for 2, interiors for 4. */
  position: 5,
  /** Owning a cell at criticalMass - 1 next to an enemy cell at criticalMass - 1
   *  is a liability, because the opponent moves first. */
  vulnerability: 15,
  win: 1_000_000,
} as const

/** Positional score of a single cell, from its critical mass alone. */
function positionValue(mass: number): number {
  // 5 - mass: corner 3, edge 2, interior 1. Derived, never a corner branch.
  return WEIGHTS.position * (5 - mass)
}

/** Absolute score per player. Exported so the evaluation stays inspectable. */
export function scores(state: GameState): Int32Array {
  const out = new Int32Array(state.players)
  const { owners, counts, adjacency } = state.board
  const { criticalMass, start, list } = adjacency

  for (let index = 0; index < owners.length; index += 1) {
    const owner = owners[index]
    if (owner === NO_OWNER) continue

    const mass = criticalMass[index]
    const count = counts[index]
    out[owner] += WEIGHTS.orb * count + WEIGHTS.cell + positionValue(mass)

    if (count !== mass - 1) continue

    // One orb from detonating, and so is a neighbouring enemy: they get there first.
    for (let slot = start[index]; slot < start[index + 1]; slot += 1) {
      const neighbour = list[slot]
      const other = owners[neighbour]
      if (other === NO_OWNER || other === owner) continue
      if (counts[neighbour] === criticalMass[neighbour] - 1) {
        out[owner] -= WEIGHTS.vulnerability
      }
    }
  }

  return out
}

/**
 * Position value from `me`'s point of view: my score less the strongest
 * opponent's. Paranoid rather than max-n, which keeps the game zero-sum and
 * therefore keeps alpha-beta pruning sound with more than two players.
 */
export function evaluate(state: GameState, me: number, ply: number): number {
  if (state.winner !== null) {
    // Prefer the faster win and the slower loss.
    return state.winner === me ? WEIGHTS.win - ply : -WEIGHTS.win + ply
  }

  const table = scores(state)
  let best = -WEIGHTS.win

  for (let player = 0; player < state.players; player += 1) {
    if (player === me) continue
    if (state.eliminated[player] === 1) continue
    if (table[player] > best) best = table[player]
  }

  if (best === -WEIGHTS.win) best = 0
  return table[me] - best
}
