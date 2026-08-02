import { applyMove } from '@/lib/engine/apply'
import { NO_OWNER } from '@/lib/engine/board'
import { nextInt, normaliseSeed, type Seed } from '@/lib/engine/prng'
import { legalMoves, type GameState } from '@/lib/engine/state'
import { evaluate, WEIGHTS } from './evaluate'

/**
 * Minimax with alpha-beta and iterative deepening.
 *
 * The AI sees exactly what the player sees and may only return a move from
 * `legalMoves` — nothing is hidden in this game, so any advantage would be
 * fabricated. Difficulty is search depth plus seeded noise, nothing else
 * (PRD §8).
 *
 * The clock is injected rather than read here, so `lib/ai` stays pure and the
 * time budget is testable without waiting for real time to pass.
 */
export type Difficulty = 'mudah' | 'sedang' | 'sulit'

export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  mudah: 1,
  sedang: 3,
  sulit: 6,
}

/** Easy play is weakened by seeded noise, never by cheating. */
const NOISE_MARGIN: Record<Difficulty, number> = {
  mudah: 90,
  sedang: 12,
  sulit: 0,
}

export type SearchOptions = {
  readonly difficulty: Difficulty
  readonly budgetMs: number
  readonly seed: Seed
  /** Monotonic clock in milliseconds. Injected; defaults to a fresh reading. */
  readonly now?: () => number
}

export type SearchResult = {
  readonly index: number
  readonly score: number
  readonly depth: number
  readonly nodes: number
  readonly elapsedMs: number
}

class SearchAborted extends Error {
  constructor() {
    super('search budget exhausted')
    this.name = 'SearchAborted'
  }
}

type Context = {
  me: number
  deadline: number
  now: () => number
  nodes: number
}

/** Checked every so often; a per-node clock read costs more than the search. */
const CLOCK_INTERVAL = 256

function checkBudget(ctx: Context): void {
  ctx.nodes += 1
  if (ctx.nodes % CLOCK_INTERVAL === 0 && ctx.now() >= ctx.deadline) throw new SearchAborted()
}

/**
 * Move ordering: cells about to detonate first, then cheap positions. Better
 * ordering means deeper search in the same budget; it never changes legality.
 */
function orderedMoves(state: GameState): number[] {
  const moves = legalMoves(state)
  const { counts, owners, adjacency } = state.board

  return moves
    .map((index) => {
      const mass = adjacency.criticalMass[index]
      let rank = (5 - mass) * 2
      if (owners[index] !== NO_OWNER && counts[index] === mass - 1) rank += 20
      return { index, rank }
    })
    .sort((a, b) => (b.rank === a.rank ? a.index - b.index : b.rank - a.rank))
    .map((entry) => entry.index)
}

function alphaBeta(
  state: GameState,
  depth: number,
  ply: number,
  alphaIn: number,
  betaIn: number,
  ctx: Context,
): number {
  checkBudget(ctx)

  if (state.winner !== null || depth === 0) return evaluate(state, ctx.me, ply)

  const maximizing = state.current === ctx.me
  let alpha = alphaIn
  let beta = betaIn
  let best = maximizing ? -WEIGHTS.win * 2 : WEIGHTS.win * 2

  for (const index of orderedMoves(state)) {
    const next = applyMove(state, { type: 'place', player: state.current, index }).state
    const score = alphaBeta(next, depth - 1, ply + 1, alpha, beta, ctx)

    if (maximizing) {
      if (score > best) best = score
      if (best > alpha) alpha = best
    } else {
      if (score < best) best = score
      if (best < beta) beta = best
    }

    if (beta <= alpha) break
  }

  return best
}

/**
 * Pick a move for the player to act. Always returns a legal cell.
 * Iterative deepening keeps the best move from the last *completed* depth, so
 * running out of budget mid-depth degrades gracefully instead of losing work.
 */
export function chooseMove(state: GameState, options: SearchOptions): SearchResult {
  const moves = orderedMoves(state)
  if (moves.length === 0) throw new Error('no legal move to choose')

  const now = options.now ?? (() => Date.now())
  const startedAt = now()
  const ctx: Context = {
    me: state.current,
    deadline: startedAt + Math.max(1, options.budgetMs),
    now,
    nodes: 0,
  }

  const maxDepth = DIFFICULTY_DEPTH[options.difficulty]
  let best = { index: moves[0], score: -WEIGHTS.win * 2 }
  let reached = 0
  let seed: Seed = normaliseSeed(options.seed)

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    let alpha = -WEIGHTS.win * 2
    const scored: { index: number; score: number }[] = []

    try {
      for (const index of moves) {
        const next = applyMove(state, { type: 'place', player: state.current, index }).state
        const score = alphaBeta(next, depth - 1, 1, alpha, WEIGHTS.win * 2, ctx)
        scored.push({ index, score })
        if (score > alpha) alpha = score
      }
    } catch (error) {
      if (error instanceof SearchAborted) break
      throw error
    }

    reached = depth
    best = scored.reduce((top, entry) => (entry.score > top.score ? entry : top), scored[0])

    // Seeded noise: pick among moves close to the best. Weaker play, still legal,
    // still reproducible from the seed.
    const margin = NOISE_MARGIN[options.difficulty]
    if (margin > 0) {
      const pool = scored.filter((entry) => best.score - entry.score <= margin)
      const draw = nextInt(seed, pool.length)
      seed = draw.seed
      best = pool[draw.value] ?? best
    }
  }

  return {
    index: best.index,
    score: best.score,
    depth: reached,
    nodes: ctx.nodes,
    elapsedMs: now() - startedAt,
  }
}
