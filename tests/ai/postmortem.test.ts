import { describe, expect, it } from 'vitest'
import { isDecisive, playAlternative, reviewGame } from '@/lib/ai/postmortem'
import { scoreMoves } from '@/lib/ai/search'
import { WEIGHTS } from '@/lib/ai/evaluate'
import { replayFrames } from '@/lib/engine/replay'
import { legalMoves } from '@/lib/engine/state'
import { playRandomGame } from '../random'

const CONFIG = { rows: 5, cols: 6, players: 2, seed: 9 }

describe('scoring every move at a fixed depth', () => {
  it('scores exactly the legal moves, in board order', () => {
    const game = playRandomGame(CONFIG)
    const state = replayFrames(game.record)[10].state
    const scored = scoreMoves(state, { depth: 2, budgetMs: 5_000 })

    expect(scored.moves.map((move) => move.index)).toEqual(legalMoves(state))
    expect(scored.exhausted).toBe(false)
  })

  it('is reproducible — no noise, unlike choosing a move', () => {
    const game = playRandomGame(CONFIG)
    const state = replayFrames(game.record)[8].state
    const first = scoreMoves(state, { depth: 2, budgetMs: 5_000 })
    const second = scoreMoves(state, { depth: 2, budgetMs: 5_000 })
    expect(first.moves).toEqual(second.moves)
  })

  it('sees a move that wins as decisive', () => {
    const game = playRandomGame(CONFIG)
    const frames = replayFrames(game.record)
    // The position before the final move: someone is about to win from here.
    const state = frames[frames.length - 2].state
    const scored = scoreMoves(state, { depth: 2, budgetMs: 5_000 })
    const best = scored.moves.reduce((top, move) => (move.score > top.score ? move : top))
    expect(isDecisive(best.score)).toBe(true)
    expect(best.score).toBeGreaterThan(WEIGHTS.win - 10_000)
  })
})

describe('reviewing a finished game', () => {
  const game = playRandomGame(CONFIG)
  const loser = game.final.winner === 0 ? 1 : 0
  const review = reviewGame(game.record, loser, { depth: 2, budgetMs: 60_000 })

  it('reviews only the reviewed player’s own turns', () => {
    const frames = replayFrames(game.record)
    expect(review.turns.length).toBeGreaterThan(0)
    for (const turn of review.turns) {
      // turn is 1-based; the state before it is at the same index in frames.
      expect(frames[turn.turn - 1].state.current).toBe(loser)
      expect(game.record.moves[turn.turn - 1]).toBe(turn.played)
    }
  })

  it('never reports a negative cost', () => {
    // The move played is one of the moves scored, so the best is at least as
    // good as it. A negative cost would mean the comparison is wrong.
    for (const turn of review.turns) {
      expect(turn.cost).toBeGreaterThanOrEqual(0)
      expect(turn.bestScore).toBeGreaterThanOrEqual(turn.playedScore)
    }
  })

  it('says the move played was best rather than inventing a better one', () => {
    for (const turn of review.turns) {
      if (turn.cost === 0) expect(turn.best).toBe(turn.played)
    }
  })

  it('reports the depth it actually used', () => {
    expect(review.depth).toBe(2)
    expect(review.partial).toBe(false)
  })

  /**
   * The definition that matters, and the one worth stating twice: the turning
   * point is the *last* turn at which some move was still scored in this
   * player's favour — not the biggest blunder. Raw regret is dominated by
   * win-magnitude scores, so the costliest move is almost always near the end,
   * where a loss already in motion finally becomes visible to the search.
   */
  it('puts the turning point at the last turn something still favoured them', () => {
    const point = review.turningPoint
    if (point === null) {
      // Legitimate: they were behind at every one of their own turns.
      expect(review.turns.every((turn) => turn.bestScore <= 0)).toBe(true)
      return
    }

    expect(point.bestScore).toBeGreaterThan(0)

    const after = review.turns.filter((turn) => turn.turn > point.turn)
    for (const turn of after) {
      expect(turn.bestScore).toBeLessThanOrEqual(0)
    }
  })

  it('keeps the costliest move as its own separate finding', () => {
    if (review.costliest === null) return
    for (const turn of review.turns) {
      expect(turn.cost).toBeLessThanOrEqual(review.costliest.cost)
    }
  })

  it('stops and admits it when the budget runs out', () => {
    const rushed = reviewGame(game.record, loser, { depth: 4, budgetMs: 5 })
    expect(rushed.partial).toBe(true)
    expect(rushed.turns.length).toBeLessThan(review.turns.length)
  })

  it('is reproducible', () => {
    const again = reviewGame(game.record, loser, { depth: 2, budgetMs: 60_000 })
    expect(again).toEqual(review)
  })
})

describe('the counterfactual is the real engine', () => {
  it('plays the alternative into the actual position', () => {
    const game = playRandomGame(CONFIG)
    const loser = game.final.winner === 0 ? 1 : 0
    const review = reviewGame(game.record, loser, { depth: 2, budgetMs: 60_000 })
    const point = review.turningPoint
    if (point === null) return

    const outcome = playAlternative(game.record, point.turn, point.best)
    expect(outcome).not.toBeNull()

    const frames = replayFrames(game.record)
    const before = frames[point.turn - 1].state
    // Same position, different move — and the move is one that was legal there.
    expect(legalMoves(before)).toContain(point.best)
    expect(outcome?.state.turn).toBe(before.turn + 1)
  })

  it('has no opinion about a turn outside the game', () => {
    const game = playRandomGame(CONFIG)
    expect(playAlternative(game.record, 0, 0)).toBeNull()
    expect(playAlternative(game.record, game.record.moves.length + 5, 0)).toBeNull()
  })
})
