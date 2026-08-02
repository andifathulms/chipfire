import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { legalMoves, createGame, type GameState } from '@/lib/engine/state'
import { chooseMove, DIFFICULTY_DEPTH, type Difficulty } from '@/lib/ai/search'
import { evaluate, scores } from '@/lib/ai/evaluate'
import { parseState } from '../helpers'
import { configFor } from '../random'

const BUDGET = 60

function think(state: GameState, difficulty: Difficulty, seed = 7) {
  return chooseMove(state, { difficulty, budgetMs: BUDGET, seed })
}

describe('the AI plays by the same rules as everyone else', () => {
  it('never returns an illegal move, at any difficulty', () => {
    const difficulties: Difficulty[] = ['mudah', 'sedang', 'sulit']

    for (const difficulty of difficulties) {
      for (let game = 0; game < 3; game += 1) {
        let state = createGame(configFor(game))
        let guard = 0

        while (state.winner === null && guard < 200) {
          const legal = new Set(legalMoves(state))
          const result = think(state, difficulty, game + guard)

          expect(legal.has(result.index)).toBe(true)
          state = applyMove(state, {
            type: 'place',
            player: state.current,
            index: result.index,
          }).state
          guard += 1
        }
      }
    }
  })

  it('takes the winning move when one is available', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
      current: 0,
    })

    // Detonating the corner converts B's only cell and ends the game.
    expect(think(state, 'sulit').index).toBe(0)
  })
})

describe('the time budget is respected', () => {
  it('stops deepening when the injected clock runs out', () => {
    const state = createGame({ rows: 6, cols: 9, players: 2, seed: 1 })
    let clock = 0

    const result = chooseMove(state, {
      difficulty: 'sulit',
      budgetMs: 40,
      seed: 1,
      // Each reading advances well past the budget, so only the shallowest
      // completed depth survives — the graceful-degradation path.
      now: () => {
        clock += 30
        return clock
      },
    })

    expect(result.depth).toBeLessThan(DIFFICULTY_DEPTH.sulit)
    expect(legalMoves(state)).toContain(result.index)
  })

  it('reports the depth it actually reached', () => {
    const state = createGame({ rows: 4, cols: 4, players: 2, seed: 1 })
    const result = chooseMove(state, { difficulty: 'sedang', budgetMs: 2000, seed: 3 })
    expect(result.depth).toBe(DIFFICULTY_DEPTH.sedang)
    expect(result.nodes).toBeGreaterThan(0)
  })
})

describe('evaluation', () => {
  it('prefers a corner to an interior cell of the same size', () => {
    const corner = parseState({
      board: `
        A1 .  .
        .  .  B1
        .  .  .
      `,
    })
    const interior = parseState({
      board: `
        .  .  .
        .  A1 B1
        .  .  .
      `,
    })

    expect(evaluate(corner, 0, 0)).toBeGreaterThan(evaluate(interior, 0, 0))
  })

  it('penalises a loaded cell sitting next to a loaded enemy cell', () => {
    // Both boards hold the same material; only adjacency differs. A's corner is
    // one orb from detonating and so is B's edge cell. The penalty is asserted
    // on the absolute score, because in the relative view a mutual standoff
    // cancels out and would hide the term entirely.
    const exposed = parseState({
      board: `
        A1 B2 .
        .  .  .
        .  .  .
      `,
    })
    const safe = parseState({
      board: `
        A1 .  .
        .  .  B2
        .  .  .
      `,
    })

    expect(scores(exposed)[0]).toBeLessThan(scores(safe)[0])
    expect(scores(exposed)[1]).toBeLessThan(scores(safe)[1])
  })
})

describe('difficulty ordering', () => {
  it('has the deeper search beat the shallow one over a match series', () => {
    let strongWins = 0
    let played = 0

    for (let game = 0; game < 6; game += 1) {
      // Alternate who moves first, so the result is not an opening-advantage artefact.
      const strong: number = game % 2
      let state = createGame({ rows: 4, cols: 5, players: 2, seed: game + 1 })
      let guard = 0

      while (state.winner === null && guard < 300) {
        const difficulty: Difficulty = state.current === strong ? 'sulit' : 'mudah'
        const result = chooseMove(state, {
          difficulty,
          budgetMs: 120,
          seed: game * 31 + guard,
        })
        state = applyMove(state, {
          type: 'place',
          player: state.current,
          index: result.index,
        }).state
        guard += 1
      }

      if (state.winner !== null) {
        played += 1
        if (state.winner === strong) strongWins += 1
      }
    }

    expect(played).toBeGreaterThan(0)
    expect(strongWins * 2).toBeGreaterThan(played) // a clear majority, not a coin flip
  })
})
