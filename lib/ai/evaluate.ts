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
 * The same arithmetic as `scores`, broken into its named terms.
 *
 * PRD §8 calls the evaluation "hand-written and inspectable", and that has been
 * true only of the source: a player could read evaluate.ts or take the AI's
 * word for it. This is what makes the claim checkable from inside the app —
 * every term is one of the integer weights above, applied the way the search
 * applies it.
 *
 * Deliberately *not* implemented by having `scores` call this. `scores` runs in
 * the alpha-beta inner loop, thousands of times per move, and allocating an
 * object per player per node would be paid on every search whether or not
 * anyone is looking. The duplication is the price; the test that asserts the
 * two agree across random positions is what keeps it honest.
 */
export type ScoreTerms = {
  /** Orbs held, times the orb weight. */
  readonly orbs: number
  /** Cells held, times the cell weight. */
  readonly cells: number
  /** Sum of positional value — corners are worth more because they detonate
   *  for less. */
  readonly position: number
  /** Negative. Cells at criticalMass - 1 beside an enemy cell also at
   *  criticalMass - 1, which the opponent reaches first. */
  readonly vulnerability: number
  /** The four above, summed. Equals `scores(state)[player]`. */
  readonly total: number
}

export function explainScores(state: GameState): ScoreTerms[] {
  const out: ScoreTerms[] = []
  const { owners, counts, adjacency } = state.board
  const { criticalMass, start, list } = adjacency

  const orbs = new Int32Array(state.players)
  const cells = new Int32Array(state.players)
  const position = new Int32Array(state.players)
  const vulnerability = new Int32Array(state.players)

  for (let index = 0; index < owners.length; index += 1) {
    const owner = owners[index]
    if (owner === NO_OWNER) continue

    const mass = criticalMass[index]
    const count = counts[index]

    orbs[owner] += WEIGHTS.orb * count
    cells[owner] += WEIGHTS.cell
    position[owner] += positionValue(mass)

    if (count !== mass - 1) continue

    for (let slot = start[index]; slot < start[index + 1]; slot += 1) {
      const neighbour = list[slot]
      const other = owners[neighbour]
      if (other === NO_OWNER || other === owner) continue
      if (counts[neighbour] === criticalMass[neighbour] - 1) {
        vulnerability[owner] -= WEIGHTS.vulnerability
      }
    }
  }

  for (let player = 0; player < state.players; player += 1) {
    out.push({
      orbs: orbs[player],
      cells: cells[player],
      position: position[player],
      vulnerability: vulnerability[player],
      total: orbs[player] + cells[player] + position[player] + vulnerability[player],
    })
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
