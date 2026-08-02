import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { createGame } from '@/lib/engine/state'
import { parseState } from '../helpers'

describe('elimination only applies after a player has taken a turn', () => {
  it('does not eliminate anyone on the opening move', () => {
    const state = createGame({ rows: 6, cols: 9, players: 4, seed: 1 })
    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(events.some((event) => event.type === 'eliminate')).toBe(false)
    expect(next.winner).toBeNull()
    expect(Array.from(next.eliminated)).toEqual([0, 0, 0, 0])
    expect(next.current).toBe(1)
  })

  it('does not declare a winner while opponents are still waiting for a first turn', () => {
    const state = createGame({ rows: 3, cols: 3, players: 3, seed: 1 })
    const afterFirst = applyMove(state, { type: 'place', player: 0, index: 0 }).state
    const afterSecond = applyMove(afterFirst, { type: 'place', player: 1, index: 8 }).state

    expect(afterSecond.winner).toBeNull()
    expect(afterSecond.current).toBe(2)
  })

  it('eliminates a player who has moved and lost every orb', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  C1
        .  .  .
      `,
      players: 3,
      current: 0,
    })

    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(events.some((event) => event.type === 'eliminate' && event.player === 1)).toBe(true)
    expect(next.eliminated[1]).toBe(1)
    expect(next.winner).toBeNull() // C still holds a cell
    expect(next.current).toBe(2) // B is skipped
  })

  it('declares a winner when only one player holds orbs', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
      current: 0,
    })

    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(next.winner).toBe(0)
    expect(events.at(-1)).toEqual({ type: 'win', player: 0 })
  })

  it('refuses further moves once the game is over', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
      current: 0,
    })

    const { state: finished } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(() => applyMove(finished, { type: 'place', player: 0, index: 5 })).toThrow(
      /illegal move/,
    )
  })
})
