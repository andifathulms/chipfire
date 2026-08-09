import { describe, expect, it } from 'vitest'
import {
  PUZZLE_COUNT,
  PUZZLE_SEEDS,
  findPuzzle,
  puzzleAt,
  winningMoves,
} from '@/lib/puzzle'
import { applyMove } from '@/lib/engine/apply'
import { replay } from '@/lib/engine/replay'
import { legalMoves } from '@/lib/engine/state'
import { parseState } from '../helpers'

describe('winning moves are decided, not estimated', () => {
  it('finds the move that ends it', () => {
    /*
     * Orange holds one corner at critical mass - 1; blue holds the cell beside
     * it with its last orb. Firing the corner takes blue's only cell, so blue
     * has nothing left and the game is over.
     */
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
      current: 0,
    })

    expect(winningMoves(state)).toEqual([0])
  })

  it('has no opinion once the game is over', () => {
    const state = parseState({
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
      current: 0,
    })

    const after = applyMove(state, { type: 'place', player: 0, index: 0 })
    expect(after.state.winner).toBe(0)
    expect(winningMoves(after.state)).toEqual([])
  })

  it('agrees with actually playing the move', () => {
    // The claim "this wins" has to survive being tested against the real thing,
    // on every position of every shipped puzzle.
    for (const seed of PUZZLE_SEEDS) {
      const puzzle = findPuzzle(seed)
      expect(puzzle).not.toBeNull()
      if (puzzle === null) continue

      const state = replay({ config: puzzle.config, moves: puzzle.moves })
      for (const index of legalMoves(state)) {
        const played = applyMove(state, { type: 'place', player: state.current, index })
        const claimed = winningMoves(state).includes(index)
        expect(claimed).toBe(played.state.winner === state.current)
      }
    }
  })
})

describe('every shipped puzzle', () => {
  const puzzles = PUZZLE_SEEDS.map((seed) => findPuzzle(seed))

  it('still exists', () => {
    puzzles.forEach((puzzle, position) => {
      expect(puzzle, `seed ${PUZZLE_SEEDS[position]} no longer yields a puzzle`).not.toBeNull()
    })
  })

  it('has exactly one winning move', () => {
    for (const puzzle of puzzles) {
      if (puzzle === null) continue
      const state = replay({ config: puzzle.config, moves: puzzle.moves })
      const winners = winningMoves(state)
      expect(winners).toEqual([puzzle.solution])
    }
  })

  it('is posed to the player who moves first, with the game still open', () => {
    for (const puzzle of puzzles) {
      if (puzzle === null) continue
      const state = replay({ config: puzzle.config, moves: puzzle.moves })
      expect(state.winner).toBeNull()
      expect(state.current).toBe(0)
    }
  })

  it('offers enough choices to be a puzzle rather than a formality', () => {
    for (const puzzle of puzzles) {
      if (puzzle === null) continue
      const state = replay({ config: puzzle.config, moves: puzzle.moves })
      expect(legalMoves(state).length).toBeGreaterThanOrEqual(6)
    }
  })

  it('is solved by a chain rather than a single capture', () => {
    for (const puzzle of puzzles) {
      if (puzzle === null) continue
      expect(puzzle.explosions).toBeGreaterThanOrEqual(2)
    }
  })

  it('is reproducible — the same seed is the same puzzle', () => {
    for (const seed of PUZZLE_SEEDS) {
      expect(findPuzzle(seed)).toEqual(findPuzzle(seed))
    }
  })

  it('ramps in chain size rather than jumping about', () => {
    const sizes = puzzles.map((puzzle) => puzzle?.explosions ?? 0)
    for (let position = 1; position < sizes.length; position += 1) {
      expect(sizes[position]).toBeGreaterThanOrEqual(sizes[position - 1])
    }
  })

  it('is reachable by position', () => {
    expect(PUZZLE_COUNT).toBe(PUZZLE_SEEDS.length)
    expect(puzzleAt(0)?.seed).toBe(PUZZLE_SEEDS[0])
    expect(puzzleAt(PUZZLE_COUNT)).toBeNull()
    expect(puzzleAt(-1)).toBeNull()
  })
})
