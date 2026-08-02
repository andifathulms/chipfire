import { describe, expect, it } from 'vitest'
import { boardSize, NO_OWNER } from '@/lib/engine/board'
import type { GameState } from '@/lib/engine/state'
import { configFor, playRandomGame, TURN_CAP } from '../random'

/**
 * Thousands of random legal games run to completion: no crash, no runaway, and
 * a valid terminal state every time. Run before any release.
 */
const GAMES = 3000

function assertConsistent(state: GameState): void {
  const size = boardSize(state.board)
  const tally = new Int32Array(state.players)

  for (let index = 0; index < size; index += 1) {
    const owner = state.board.owners[index]
    const count = state.board.counts[index]

    // An owned cell holds orbs and an unowned one does not — no half states.
    if (owner === NO_OWNER) {
      expect(count).toBe(0)
      continue
    }
    expect(count).toBeGreaterThan(0)
    expect(Number.isInteger(count)).toBe(true)
    tally[owner] += count
  }

  expect(Array.from(tally)).toEqual(Array.from(state.orbs))
}

describe('simulation', () => {
  it('plays every generated game to a valid terminal state', () => {
    for (let index = 0; index < GAMES; index += 1) {
      const played = playRandomGame(configFor(index))
      const { final } = played

      expect(final.winner).not.toBeNull()
      expect(played.turns).toBeLessThan(TURN_CAP)
      assertConsistent(final)

      const winner = final.winner ?? -1
      expect(final.orbs[winner]).toBeGreaterThan(0)

      for (let player = 0; player < final.players; player += 1) {
        if (player === winner) continue
        expect(final.orbs[player]).toBe(0)
        expect(final.eliminated[player]).toBe(1)
      }
    }
  })
})
