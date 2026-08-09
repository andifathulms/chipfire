import type { Board } from './board'

/**
 * How loaded the board is — the accumulation half of the game.
 *
 * The app renders release beautifully and shows stress only one cell at a time,
 * as the tremble at `criticalMass - 1`. But the rhythm this game is built on is
 * long quiet accumulation and then one move that sweeps the board (PRD §1), and
 * during the quiet part nothing on screen says the quiet is going anywhere. A
 * board four moves in and a board forty moves in look alike to anyone who is not
 * counting orbs cell by cell.
 *
 * This is the sandpile's own state variable, and it is a *reading*, not advice:
 * it describes the system, never the move you should make. That line is what
 * keeps it on the right side of the preview question — an instrument on the
 * panel rather than an oracle.
 *
 * Nothing here feeds back into the engine. It is never hashed, never sent, never
 * an input to `applyMove` or to search, so it cannot influence the game it
 * measures — which is also why the one division below is harmless.
 */
export type BoardLoad = {
  /** Orbs on the board. */
  readonly orbs: number
  /** Orbs the board can hold while every cell is still at rest. */
  readonly capacity: number
  /** `orbs` against `capacity`, floored to a whole percent. */
  readonly percent: number
  /** Cells one orb short of going off — the ones that tremble. */
  readonly primed: number
}

/**
 * A cell rests at up to `criticalMass - 1` orbs; at `criticalMass` it fires.
 * Summing that ceiling over the lattice gives the largest number of orbs that
 * can sit on this board without anything detonating — the stable configuration
 * of the abelian sandpile, and the natural denominator for "how full is it".
 *
 * Derived from `criticalMass`, so it follows the topology rather than assuming
 * a rectangle (invariant 7).
 */
export function boardCapacity(board: Board): number {
  const mass = board.adjacency.criticalMass
  let total = 0
  for (let index = 0; index < mass.length; index += 1) total += mass[index] - 1
  return total
}

export function boardLoad(board: Board): BoardLoad {
  const mass = board.adjacency.criticalMass
  const { counts } = board

  let orbs = 0
  let primed = 0
  let capacity = 0

  // One pass, ascending index. Positional, never a Set (invariant 2) — this is
  // only a readout, but engine code that iterates unordered collections is how
  // the habit gets into code where it matters.
  for (let index = 0; index < counts.length; index += 1) {
    const count = counts[index]
    orbs += count
    capacity += mass[index] - 1
    if (count > 0 && count === mass[index] - 1) primed += 1
  }

  /*
   * The only division in the engine, and it is safe: both operands are small
   * integers (a 12×14 board caps `orbs * 100` in the low tens of thousands),
   * so the quotient is exact in a double and `Math.floor` returns an integer on
   * every platform. It is also load-bearing for nothing — see the note above.
   */
  const percent = capacity === 0 ? 0 : Math.floor((orbs * 100) / capacity)

  return { orbs, capacity, percent, primed }
}
