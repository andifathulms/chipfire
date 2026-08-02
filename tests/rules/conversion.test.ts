import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { expectBoard, parseState, renderBoard } from '../helpers'

/** Conversion on receipt is the whole game: a placement flips territory it never touched. */
describe('cells convert to the exploding player', () => {
  it('takes ownership of every neighbour that receives an orb', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  B1
        .  .  .
      `,
    })

    const { state: next } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(renderBoard(next)).toBe(
      expectBoard(`
        .  A2 .
        A1 .  B1
        .  .  .
      `),
    )
  })

  it('carries the receiving cell existing orbs across to the new owner', () => {
    const state = parseState({
      board: `
        A1 B2 .
        .  .  B1
        .  .  .
      `,
    })

    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 0 })

    // B's two orbs become A's, plus the one received: three orbs at critical
    // mass 3, so the converted cell detonates in turn.
    expect(events.filter((event) => event.type === 'explode')).toHaveLength(2)
    expect(next.orbs[1]).toBe(1) // only the untouched cell 5 remains B's
    expect(next.orbs[0]).toBe(4)
  })

  it('reports the previous owner in the convert event', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  B1
        .  .  .
      `,
    })

    const { events } = applyMove(state, { type: 'place', player: 0, index: 0 })
    const converts = events.flatMap((event) => (event.type === 'convert' ? [event] : []))

    expect(converts).toEqual([
      { type: 'convert', index: 1, from: 1, to: 0, count: 2, step: 0 },
      { type: 'convert', index: 3, from: null, to: 0, count: 1, step: 0 },
    ])
  })
})
