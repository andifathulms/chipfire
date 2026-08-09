import { describe, expect, it } from 'vitest'
import { boardCapacity, boardLoad } from '@/lib/engine/load'
import { createBoard } from '@/lib/engine/board'
import { createGame } from '@/lib/engine/state'
import { parseState } from '../helpers'
import { playRandomGame } from '../random'
import { replayFrames } from '@/lib/engine/replay'

describe('board capacity', () => {
  /*
   * Stated input, stated output. On 3×3 the lattice is 4 corners at critical
   * mass 2, 4 edges at 3, and one interior cell at 4 — so the board rests at
   * 4×1 + 4×2 + 1×3 = 15 orbs, and the sixteenth cannot be placed anywhere
   * without something going off.
   */
  it('is the resting ceiling of the lattice, counted by hand', () => {
    expect(boardCapacity(createBoard(3, 3))).toBe(15)
  })

  it('follows the topology rather than the rectangle', () => {
    // 6×9: 4 corners at 1, 22 edge cells at 2, 28 interior at 3.
    expect(boardCapacity(createBoard(6, 9))).toBe(4 * 1 + 22 * 2 + 28 * 3)
  })
})

describe('board load', () => {
  it('reads zero on an empty board', () => {
    const load = boardLoad(createGame({ rows: 3, cols: 3 }).board)
    expect(load).toEqual({ orbs: 0, capacity: 15, percent: 0, primed: 0 })
  })

  it('counts orbs, not cells', () => {
    // 3 + 1 + 2 = 6 orbs across 3 occupied cells, against a capacity of 15.
    const state = parseState({
      board: `
        A3 .  B1
        .  .  .
        .  B2 .
      `,
    })
    const load = boardLoad(state.board)
    expect(load.orbs).toBe(6)
    expect(load.capacity).toBe(15)
    expect(load.percent).toBe(40)
  })

  it('primes a cell at exactly one short of its own critical mass', () => {
    /*
     * Position-dependent, which is the point: the same two orbs are primed in
     * a corner (mass 2 → primed at 1) and idle in the middle (mass 4 → primed
     * at 3). Hardcoding 3 here would pass on this board and lie on a hex one.
     */
    const state = parseState({
      board: `
        A1 .  .
        .  B3 .
        .  .  B2
      `,
    })
    // Corner A1: mass 2, at 1 — primed. Centre B3: mass 4, at 3 — primed.
    // Corner B2: mass 2, at 2 — already over, not primed, would have fired.
    expect(boardLoad(state.board).primed).toBe(2)
  })

  it('does not count an empty cell as primed', () => {
    // Every cell of an empty 3x3 sits at 0, and a corner's mass is 2, so
    // `count === mass - 1` would be true at zero orbs without the guard.
    expect(boardLoad(createGame({ rows: 3, cols: 3 }).board).primed).toBe(0)
  })

  it('floors rather than rounds, so it never reads full before it is', () => {
    // 13 of 15 is 86.67%. Rounding would report 87; the reading is 86, because
    // a gauge that rounds up says "full" while there is still room.
    const state = parseState({
      board: `
        A1 B2 A1
        B2 A3 B2
        A1 B1 .
      `,
    })
    expect(boardLoad(state.board).orbs).toBe(13)
    expect(boardLoad(state.board).percent).toBe(86)
  })
})

describe('the reading is bounded by the rules that produce it', () => {
  /**
   * The load can never exceed 100% at a resting position, because a cascade by
   * definition runs until nothing is above its critical mass. If this ever
   * fails, the cascade stopped early somewhere it should not have — which is
   * the interesting failure, not the arithmetic.
   *
   * The terminal position is excluded on purpose: the victory check halts the
   * cascade the instant one player owns everything (invariant 5), so the final
   * board legitimately has cells still above their mass.
   */
  it('stays at or under capacity at every resting position of a real game', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const game = playRandomGame({ rows: 5, cols: 6, players: 2, seed })
      const frames = replayFrames(game.record)

      for (const frame of frames) {
        if (frame.state.winner !== null) continue
        const load = boardLoad(frame.state.board)
        expect(load.orbs).toBeLessThanOrEqual(load.capacity)
        expect(load.percent).toBeLessThanOrEqual(100)
      }
    }
  })
})
