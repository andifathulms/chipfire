import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { expectBoard, parseState, renderBoard } from '../helpers'

/**
 * The single most common implementation error in this game: an exploding cell
 * subtracts its critical mass, it is **not** zeroed. Zeroing produces play that
 * looks plausible and is wrong, so this fixture is stated by hand and must
 * never be "simplified" away.
 */
describe('explosion subtracts critical mass', () => {
  it('leaves the remainder in a cell that was over its critical mass', () => {
    // A plays the top-left corner. It detonates at 2, pushing cells 1 and 3
    // over their edge threshold of 3; both then feed the centre, which reaches
    // 5 against a critical mass of 4 and must keep 1 orb.
    const state = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })

    const { state: next } = applyMove(state, { type: 'place', player: 0, index: 0 })

    expect(next.board.counts[4]).toBe(1) // 5 - 4, not 0
    expect(next.board.owners[4]).toBe(0)

    expect(renderBoard(next)).toBe(
      expectBoard(`
        .  A2 A1
        A2 A1 A1
        A1 A1 B1
      `),
    )
  })

  it('empties a cell only when the subtraction lands exactly on zero', () => {
    const state = parseState({
      board: `
        A1 .  .
        .  .  B1
        .  .  .
      `,
    })

    const { state: next } = applyMove(state, { type: 'place', player: 0, index: 0 })

    // Corner critical mass is 2, count was 2, so this one really is empty.
    expect(next.board.counts[0]).toBe(0)
    expect(next.board.owners[0]).toBe(-1)
  })
})
