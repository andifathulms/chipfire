import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { CascadeRunawayError } from '@/lib/engine/cascade'
import { countExplosions } from '@/lib/engine/events'
import { parseState } from '../helpers'
import { configFor, playRandomGame } from '../random'

/**
 * Adversarial boards, deliberately built near the runaway condition: one player
 * about to own everything, with every cell one orb from critical mass.
 *
 * The engine must halt through the victory check inside the cascade loop. The
 * iteration backstop must never be the thing that stops it — if it ever fires,
 * that is a bug report, not a passing test.
 */
describe('cascade termination', () => {
  it('halts the instant one player owns every orb, on a fully loaded board', () => {
    // Every cell sits at criticalMass - 1 except the one B holds. A single
    // placement detonates the entire board; without the in-loop victory check
    // this cascade never ends.
    const state = parseState({
      board: `
        A1 A2 A2 A1
        A2 A3 A3 A2
        A2 A3 A3 A2
        A1 A2 A2 B1
      `,
    })

    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(next.winner).toBe(0)
    expect(events.at(-1)).toEqual({ type: 'win', player: 0 })
    expect(countExplosions(events)).toBeLessThan(state.board.rows * state.board.cols * 8)
  })

  it('halts on a board that is entirely one player except a single corner', () => {
    const state = parseState({
      board: `
        A2 A3 A3 A2
        A3 A3 A3 A3
        A3 A3 A3 A3
        A2 A3 A3 B1
      `,
      current: 0,
    })

    // Legal: A tops up a cell it already owns, and the board detonates.
    expect(() => applyMove(state, { type: 'place', player: 0, index: 5 })).not.toThrow(
      CascadeRunawayError,
    )
    const { state: next } = applyMove(state, { type: 'place', player: 0, index: 5 })
    expect(next.winner).toBe(0)
  })

  it('survives a long alternating cascade without hitting the backstop', () => {
    const state = parseState({
      board: `
        A1 B2 A2 B2 A1
        B2 A3 B3 A3 B2
        A2 B3 A3 B3 A2
        B2 A3 B3 A3 B2
        A1 B2 A2 B2 A1
      `,
    })

    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 12 })

    expect(next.winner === null || next.winner === 0 || next.winner === 1).toBe(true)
    expect(countExplosions(events)).toBeGreaterThan(0)
  })

  it('never terminates a generated game by the backstop', () => {
    for (let index = 0; index < 200; index += 1) {
      expect(() => playRandomGame(configFor(index))).not.toThrow()
    }
  })
})
