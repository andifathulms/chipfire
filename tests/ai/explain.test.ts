import { describe, expect, it } from 'vitest'
import { WEIGHTS, explainScores, scores } from '@/lib/ai/evaluate'
import { replayFrames } from '@/lib/engine/replay'
import { parseState } from '../helpers'
import { playRandomGame } from '../random'

/**
 * The breakdown exists so a player can check the AI's arithmetic rather than
 * take its word for it. That is worth nothing if the breakdown is a second,
 * approximate implementation — an inspector that disagrees with the thing it
 * inspects is worse than no inspector, because it looks like evidence.
 */
describe('the breakdown is the same arithmetic the search runs on', () => {
  it('sums to the score, on a stated position', () => {
    const state = parseState({
      board: `
        A1 B2 .
        .  A3 B1
        A1 .  B2
      `,
    })

    const table = scores(state)
    const terms = explainScores(state)

    terms.forEach((player, index) => {
      expect(player.orbs + player.cells + player.position + player.vulnerability).toBe(player.total)
      expect(player.total).toBe(table[index])
    })
  })

  it('sums to the score at every position of real games', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const game = playRandomGame({ rows: 5, cols: 6, players: 2, seed })

      for (const frame of replayFrames(game.record)) {
        const table = scores(frame.state)
        explainScores(frame.state).forEach((player, index) => {
          expect(player.total).toBe(table[index])
        })
      }
    }
  })

  it('holds with more than two players', () => {
    const game = playRandomGame({ rows: 5, cols: 5, players: 4, seed: 21 })
    const terms = explainScores(game.final)
    const table = scores(game.final)
    expect(terms).toHaveLength(4)
    terms.forEach((player, index) => expect(player.total).toBe(table[index]))
  })
})

describe('the terms mean what they are labelled', () => {
  it('counts orbs and cells separately', () => {
    // A single cell holding three orbs: one cell, three orbs.
    const state = parseState({
      board: `
        A3 .  .
        .  .  .
        .  .  .
      `,
      moved: [0],
    })

    const terms = explainScores(state)[0]
    expect(terms.orbs).toBe(WEIGHTS.orb * 3)
    expect(terms.cells).toBe(WEIGHTS.cell * 1)
  })

  it('values a corner above an interior cell, from critical mass alone', () => {
    const corner = parseState({ board: 'A1 . .\n. . .\n. . .', moved: [0] })
    const middle = parseState({ board: '. . .\n. A1 .\n. . .', moved: [0] })

    // Corner mass 2, interior mass 4 — and the weight is 5 - mass, so the
    // corner is worth three steps and the interior one.
    expect(explainScores(corner)[0].position).toBe(WEIGHTS.position * 3)
    expect(explainScores(middle)[0].position).toBe(WEIGHTS.position * 1)
  })

  it('charges vulnerability only for a primed cell beside a primed enemy', () => {
    /*
     * Both corners are at critical mass - 1 and adjacent along the top edge...
     * except they are not adjacent, so nothing is charged. The second board
     * puts them next to each other, and both sides pay.
     */
    const apart = parseState({ board: 'A1 . B1\n. . .\n. . .' })
    expect(explainScores(apart)[0].vulnerability).toBe(0)
    expect(explainScores(apart)[1].vulnerability).toBe(0)

    const beside = parseState({ board: 'A1 B2 .\n. . .\n. . .' })
    // A1 is a corner at mass 2, primed at 1. B2 is an edge at mass 3, primed
    // at 2. They are neighbours, so each is a liability to the other.
    expect(explainScores(beside)[0].vulnerability).toBe(-WEIGHTS.vulnerability)
    expect(explainScores(beside)[1].vulnerability).toBe(-WEIGHTS.vulnerability)
  })

  it('never reports a positive vulnerability', () => {
    for (let seed = 30; seed < 40; seed += 1) {
      const game = playRandomGame({ rows: 5, cols: 6, players: 2, seed })
      for (const frame of replayFrames(game.record)) {
        for (const player of explainScores(frame.state)) {
          expect(player.vulnerability).toBeLessThanOrEqual(0)
        }
      }
    }
  })
})
