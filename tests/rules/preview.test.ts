import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { previewMove } from '@/lib/engine/preview'
import { hashState } from '@/lib/engine/hash'
import { legalMoves } from '@/lib/engine/state'
import { parseState } from '../helpers'
import { configFor, playRandomGame } from '../random'
import { createGame } from '@/lib/engine/state'
import { toMove } from '@/lib/engine/replay'

/**
 * A preview that could disagree with the outcome would be worse than no
 * preview, so it is checked against the real move on every legal cell of a
 * generated corpus.
 */
describe('move preview', () => {
  it('marks exactly the cells the move actually changes', () => {
    for (let game = 0; game < 12; game += 1) {
      const played = playRandomGame(configFor(game))
      let state = createGame(played.record.config)

      for (const move of played.record.moves.slice(0, 8)) {
        for (const candidate of legalMoves(state)) {
          const preview = previewMove(state, candidate)
          expect(preview).not.toBeNull()

          const actual = applyMove(state, toMove(state, candidate)).state
          for (let cell = 0; cell < state.board.owners.length; cell += 1) {
            const changed =
              state.board.owners[cell] !== actual.board.owners[cell] ||
              state.board.counts[cell] !== actual.board.counts[cell]
            expect(Boolean(preview?.touched[cell])).toBe(changed)
          }
        }
        state = applyMove(state, toMove(state, move)).state
      }
    }
  })

  it('does not disturb the state it is asked about', () => {
    const state = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })
    const before = hashState(state)

    previewMove(state, 0)

    expect(hashState(state)).toBe(before)
  })

  it('counts the chain and the territory it would flip', () => {
    const state = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })

    const preview = previewMove(state, 0)

    // Five, not four: the corner detonates again after cell 3 feeds it back.
    expect(preview?.explosions).toBe(5)
    expect(preview?.capturedCount).toBe(0) // B's corner is never reached
    expect(preview?.wins).toBe(false)
  })

  it('reports a capture and a winning move', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
    })

    const preview = previewMove(state, 0)

    expect(preview?.captured[1]).toBe(1)
    expect(preview?.capturedCount).toBe(1)
    expect(preview?.wins).toBe(true)
  })

  it('returns nothing for a cell that cannot be played', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
    })

    expect(previewMove(state, 1)).toBeNull()
  })
})
