import { NO_OWNER, type PlayerId } from './board'
import type { GameEvent } from './events'
import type { GameState } from './state'

/**
 * Cascade resolution.
 *
 * Three things here are load-bearing and must not be "simplified":
 *
 * 1. An exploding cell **subtracts** its critical mass: `count -= criticalMass`.
 *    It is not zeroed. Zeroing produces play that looks entirely plausible and
 *    is wrong, which is why it is the classic bug in this game (PRD §5).
 *
 * 2. Resolution is an explicit FIFO queue, never recursion. Recursion blows the
 *    stack on exactly the long cascades that make the game interesting.
 *
 * 3. The victory check runs *inside* the loop. Once a single player owns
 *    everything the cascade would run forever, so it halts the moment only one
 *    player has orbs. The iteration backstop below is a safety net; reaching it
 *    is a bug to report, never a normal exit.
 */

/** Backstop only. Generous enough that a legitimate cascade never approaches it. */
export const ITERATION_BUDGET_PER_CELL = 512

export class CascadeRunawayError extends Error {
  constructor(readonly iterations: number) {
    super(
      `cascade exceeded its iteration backstop after ${iterations} explosions — ` +
        'the victory check should have halted it first; this is a bug, not a normal exit',
    )
    this.name = 'CascadeRunawayError'
  }
}

/**
 * The only player left holding orbs, or null if the game continues.
 * A player who has not yet taken a turn holds zero orbs legitimately, so they
 * are not treated as gone — without that guard everyone is out on move one.
 */
export function findSoleSurvivor(state: GameState): PlayerId | null {
  let survivor = -1

  for (let player = 0; player < state.players; player += 1) {
    if (state.eliminated[player] === 1) continue
    if (state.orbs[player] > 0) {
      if (survivor !== -1) return null
      survivor = player
    } else if (state.hasMoved[player] === 0) {
      return null
    }
  }

  return survivor === -1 ? null : survivor
}

/**
 * Resolve every over-critical cell reachable from `origin`, mutating the
 * (already cloned) state and appending to `events`.
 * Returns the winner if the cascade ended the game, otherwise null.
 */
export function resolveCascade(
  state: GameState,
  origin: number,
  events: GameEvent[],
): PlayerId | null {
  const { counts, owners, adjacency } = state.board
  const { criticalMass, start, list } = adjacency
  const size = counts.length
  const budget = size * ITERATION_BUDGET_PER_CELL

  if (counts[origin] < criticalMass[origin]) return null

  // Positional membership flags, not a Set — Set iteration order is precisely
  // the nondeterminism that would desync two peers.
  const queued = new Uint8Array(size)
  const queue: number[] = [origin]
  queued[origin] = 1

  let head = 0
  let step = 0
  let iterations = 0

  while (head < queue.length) {
    // One wave per step, so animation can group simultaneous explosions.
    const waveEnd = queue.length

    while (head < waveEnd) {
      const index = queue[head]
      head += 1
      queued[index] = 0

      const mass = criticalMass[index]
      if (counts[index] < mass) continue

      const player = owners[index]
      if (player === NO_OWNER) continue

      events.push({ type: 'explode', index, player, step })

      // The subtraction. Not `counts[index] = 0`.
      counts[index] -= mass
      state.orbs[player] -= mass
      if (counts[index] === 0) owners[index] = NO_OWNER

      const from = start[index]
      const to = start[index + 1]
      for (let slot = from; slot < to; slot += 1) {
        const neighbour = list[slot]
        const previousOwner = owners[neighbour]
        const previousCount = counts[neighbour]

        if (previousOwner !== player) {
          if (previousOwner !== NO_OWNER) state.orbs[previousOwner] -= previousCount
          state.orbs[player] += previousCount
          owners[neighbour] = player
        }

        counts[neighbour] = previousCount + 1
        state.orbs[player] += 1

        events.push({
          type: 'convert',
          index: neighbour,
          from: previousOwner === NO_OWNER ? null : previousOwner,
          to: player,
          count: previousCount + 1,
          step,
        })

        if (counts[neighbour] >= criticalMass[neighbour] && queued[neighbour] === 0) {
          queue.push(neighbour)
          queued[neighbour] = 1
        }
      }

      // Shedding once may leave the cell still over its own critical mass.
      if (counts[index] >= mass && queued[index] === 0) {
        queue.push(index)
        queued[index] = 1
      }

      iterations += 1

      const survivor = findSoleSurvivor(state)
      if (survivor !== null) return survivor

      if (iterations > budget) throw new CascadeRunawayError(iterations)
    }

    step += 1
  }

  return null
}
