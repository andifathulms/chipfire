import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { createGame, isLegalMove, legalMoves } from '@/lib/engine/state'
import { parseState } from '../helpers'

describe('legal moves', () => {
  const state = parseState({
    board: `
      A1 B1 .
      .  A2 .
      .  .  B1
    `,
    current: 0,
  })

  it('allows empty cells and own cells, in ascending index order', () => {
    expect(legalMoves(state)).toEqual([0, 2, 3, 4, 5, 6, 7])
  })

  it('rejects a cell owned by an opponent', () => {
    expect(isLegalMove(state, { type: 'place', player: 0, index: 1 })).toBe(false)
    expect(() => applyMove(state, { type: 'place', player: 0, index: 1 })).toThrow(/illegal move/)
  })

  it('rejects a move out of turn', () => {
    expect(isLegalMove(state, { type: 'place', player: 1, index: 2 })).toBe(false)
  })

  it('rejects indices outside the board', () => {
    expect(isLegalMove(state, { type: 'place', player: 0, index: -1 })).toBe(false)
    expect(isLegalMove(state, { type: 'place', player: 0, index: 9 })).toBe(false)
    expect(isLegalMove(state, { type: 'place', player: 0, index: 1.5 })).toBe(false)
  })

  it('offers every cell on an empty board', () => {
    const fresh = createGame({ rows: 6, cols: 9, players: 2, seed: 1 })
    expect(legalMoves(fresh)).toHaveLength(54)
  })
})

describe('purity', () => {
  it('never mutates the state it was given', () => {
    const before = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })

    const snapshotOwners = Array.from(before.board.owners)
    const snapshotCounts = Array.from(before.board.counts)
    const snapshotOrbs = Array.from(before.orbs)

    applyMove(before, { type: 'place', player: 0, index: 0 })

    expect(Array.from(before.board.owners)).toEqual(snapshotOwners)
    expect(Array.from(before.board.counts)).toEqual(snapshotCounts)
    expect(Array.from(before.orbs)).toEqual(snapshotOrbs)
    expect(before.turn).toBe(1)
  })

  it('produces identical results from the same input, every time', () => {
    const state = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })

    const first = applyMove(state, { type: 'place', player: 0, index: 0 })
    const second = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(Array.from(second.state.board.counts)).toEqual(Array.from(first.state.board.counts))
    expect(second.events).toEqual(first.events)
  })
})
