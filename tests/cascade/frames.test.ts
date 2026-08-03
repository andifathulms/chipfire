import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { buildFrames } from '@/components/cascade/frames'
import { cascadeDepth } from '@/lib/engine/events'
import { parseState } from '../helpers'
import { configFor, playRandomGame } from '../random'
import { createGame } from '@/lib/engine/state'
import { toMove } from '@/lib/engine/replay'

/**
 * The renderer replays the event stream and decides nothing. The proof is that
 * the last animation frame always equals the state the engine produced — if
 * they can differ, the renderer is computing outcomes and the design is wrong.
 */
describe('animation frames', () => {
  it('ends on exactly the position the engine produced', () => {
    for (let index = 0; index < 40; index += 1) {
      const played = playRandomGame(configFor(index))
      let state = createGame(played.record.config)

      for (const move of played.record.moves) {
        const result = applyMove(state, toMove(state, move))
        const frames = buildFrames(state.board, result.events)
        const last = frames.at(-1)

        expect(last).toBeDefined()
        expect(Array.from(last?.owners ?? [])).toEqual(Array.from(result.state.board.owners))
        expect(Array.from(last?.counts ?? [])).toEqual(Array.from(result.state.board.counts))

        state = result.state
      }
    }
  })

  it('emits one frame for the placement plus one per cascade generation', () => {
    const state = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })

    const result = applyMove(state, { type: 'place', player: 0, index: 0 })
    const frames = buildFrames(state.board, result.events)

    expect(frames).toHaveLength(1 + cascadeDepth(result.events))
    expect(frames[0].counts[0]).toBe(2) // the placement, before anything detonates
    expect(frames.at(-1)?.counts[4]).toBe(1) // the subtraction survives into the render
  })

  /*
   * Conversion is what a cascade is *for*, and this field went unread by the
   * renderer for long enough that nothing covered it. It is load-bearing now:
   * the board washes captured cells in the new owner's colour from it.
   */
  it('marks the cells that changed hands, and only those', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
    })

    const result = applyMove(state, { type: 'place', player: 0, index: 0 })
    const frames = buildFrames(state.board, result.events)

    // The placement itself converts nothing: the orb lands on a cell already
    // owned by the player who placed it.
    expect(frames[0].converted).toEqual([])

    // The corner reaches mass 2 and detonates into its two neighbours: one
    // held by the opponent, one empty. Both changed hands, so both are marked.
    expect(frames[1].exploding).toEqual([0])
    expect([...frames[1].converted].sort((a, b) => a - b)).toEqual([1, 3])
    expect(frames[1].owners[1]).toBe(0)
    expect(frames[1].owners[3]).toBe(0)
  })

  it('leaves a cell unmarked when an explosion reaches one it already owned', () => {
    const state = parseState({
      board: `
        A1 A1 .
        .  .  .
        .  .  .
      `,
    })

    const result = applyMove(state, { type: 'place', player: 0, index: 0 })
    const frames = buildFrames(state.board, result.events)

    // Anchor the frame first, so the assertion below cannot pass merely
    // because we are looking at a frame where nothing happened.
    expect(frames[1].exploding).toEqual([0])
    expect(frames[1].counts[1]).toBe(2) // the orb did arrive

    // ...but no owner changed, so it must not flash as a capture. Otherwise
    // every cascade claims territory it never took.
    expect(frames[1].converted).not.toContain(1)
  })

  it('marks the cells that detonated in each frame', () => {
    const state = parseState({
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
    })

    const result = applyMove(state, { type: 'place', player: 0, index: 0 })
    const frames = buildFrames(state.board, result.events)

    expect(frames[0].exploding).toEqual([])
    expect(frames[1].exploding).toEqual([0])
    expect(frames[2].exploding).toEqual([1, 3])
  })
})
