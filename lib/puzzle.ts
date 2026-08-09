import { applyMove } from './engine/apply'
import { previewMove } from './engine/preview'
import { nextInt, normaliseSeed, type Seed } from './engine/prng'
import { createGame, legalMoves, type GameConfig, type GameState } from './engine/state'

/**
 * Positions where exactly one move wins on the spot.
 *
 * The tutorial takes about two minutes and ends with a player who knows the
 * rules; the next thing available to them is losing to the AI. This is the step
 * between: the rules are known, and the remaining skill is seeing which cell
 * goes off first.
 *
 * Two things make this cheap enough to be worth having.
 *
 * A puzzle is found rather than authored. Play a seeded random game, look at
 * every position it passes through, and keep the ones that happen to have a
 * unique winning move. There is no content pipeline and nothing to translate.
 *
 * And "wins in one move" is *decidable*, not estimated. previewMove runs the
 * real applyMove on a throwaway state, so checking every legal move settles the
 * question exactly — no search depth, no evaluation, no "as far as the AI can
 * tell". A puzzle that claimed uniqueness on the strength of a bounded search
 * would eventually teach something false with total confidence; this one cannot.
 *
 * A puzzle is stored as the move list that reaches it, never as a board. The
 * position is reconstructed by replay like everything else here (PRD §6).
 */
export type Puzzle = {
  readonly seed: number
  readonly config: GameConfig
  /** Moves from the opening position to the puzzle position. */
  readonly moves: readonly number[]
  /** The one cell that wins. */
  readonly solution: number
  readonly explosions: number
  readonly captures: number
}

/** Small enough to take in at a glance; the puzzle is not a search exercise. */
export const PUZZLE_CONFIG: Omit<GameConfig, 'seed'> = { rows: 5, cols: 5, players: 2 }

/** Below this the position is nearly over and the answer is obvious. */
const MIN_CHOICES = 6

/** A one-cell capture that happens to end it teaches nothing about chains. */
const MIN_EXPLOSIONS = 2

/** Give up on a seed rather than follow a game to its end. */
const MAX_DEPTH = 200

/**
 * Every move that wins immediately, in ascending cell order.
 *
 * Exact. It asks the engine what each move does and reads the answer, which is
 * why a puzzle built on it can promise a unique solution rather than estimate
 * one.
 */
export function winningMoves(state: GameState): number[] {
  const out: number[] = []
  if (state.winner !== null) return out

  for (const index of legalMoves(state)) {
    const preview = previewMove(state, index)
    if (preview !== null && preview.wins) out.push(index)
  }
  return out
}

/**
 * The first position in seed `seed`'s random game that makes a puzzle, or null
 * if that game never produces one.
 */
export function findPuzzle(seed: number): Puzzle | null {
  const config: GameConfig = { ...PUZZLE_CONFIG, seed }
  let state = createGame(config)
  // Offset so the move-picking stream is not the state's own seed.
  let rng: Seed = normaliseSeed(seed ^ 0x2f6e2b1)
  const moves: number[] = []

  for (let depth = 0; depth < MAX_DEPTH; depth += 1) {
    if (state.winner !== null) return null

    const options = legalMoves(state)
    if (options.length === 0) return null

    /*
     * Only ever posed to the player who moves first, so the puzzle never opens
     * with "you are the blue one, whose turn it somehow is".
     */
    if (state.current === 0 && options.length >= MIN_CHOICES) {
      const winners = winningMoves(state)

      if (winners.length === 1) {
        const solution = winners[0]
        const preview = previewMove(state, solution)

        if (preview !== null && preview.explosions >= MIN_EXPLOSIONS) {
          return {
            seed,
            config,
            moves: [...moves],
            solution,
            explosions: preview.explosions,
            captures: preview.capturedCount,
          }
        }
      }
    }

    const draw = nextInt(rng, options.length)
    rng = draw.seed
    const index = options[draw.value]

    moves.push(index)
    state = applyMove(state, { type: 'place', player: state.current, index }).state
  }

  return null
}

/**
 * Seeds known to produce a puzzle, ordered by the size of the chain the
 * solution sets off — 2 explosions up to 21.
 *
 * That ordering is a ramp in scale, and it is described as one rather than as
 * difficulty: a long chain is often *easier* to spot, because the cell that
 * triggers it is visibly loaded. Calling it difficulty would be asserting
 * something about the player that the app has no way to measure.
 *
 * Fixed rather than scanned at runtime for two reasons. Puzzle 3 is then the
 * same position for everybody, which is the only way two people can talk about
 * one. And the app never spends a visitor's first seconds hunting: roughly one
 * seed in twelve yields a puzzle, so a runtime scan would be real work done at
 * the least welcome moment.
 *
 * Found by scanning upward from 1, and asserted seed by seed in
 * tests/rules/puzzle.test.ts. If any of these ever stopped being a valid
 * puzzle, the engine changed underneath it, and the test is where that surfaces.
 */
export const PUZZLE_SEEDS: readonly number[] = [
  78, 344, 279, 107, 217, 400, 104, 120, 163, 73, 264, 145,
]

export function puzzleAt(position: number): Puzzle | null {
  const seed = PUZZLE_SEEDS[position]
  return seed === undefined ? null : findPuzzle(seed)
}

export const PUZZLE_COUNT = PUZZLE_SEEDS.length
