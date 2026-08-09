import { applyMove } from '@/lib/engine/apply'
import type { PlayerId } from '@/lib/engine/board'
import { replayFrames, type GameRecord } from '@/lib/engine/replay'
import { WEIGHTS } from './evaluate'
import { scoreMoves } from './search'

/**
 * Scores at or past this are forced wins and losses rather than advantages.
 * `evaluate` offsets a win by the ply it was found at, so anything within a
 * few hundred plies of the win weight is decisive.
 */
const DECISIVE = WEIGHTS.win - 10_000

/**
 * On which turn did I actually lose?
 *
 * The app has held every ingredient for this since the engine was written — the
 * complete move list, a pure function that reconstructs any position from it,
 * and a search that can score any position — and it has never turned any of
 * them on a finished game. The AI evaluates a position to choose its move and
 * discards the number the instant the move is played.
 *
 * Every question a losing player actually asks is a special case of this one.
 * "Was that corner worth it", "should I have blocked", "did I lose it in the
 * opening" — all the same query at different resolutions.
 *
 * ── What this is allowed to claim ─────────────────────────────────────────
 *
 * Regret is `best legal move` minus `move played`, both scored by the same
 * alpha-beta the AI runs on, at a depth that is reported alongside the answer
 * and never hidden. That makes the number traceable: it is the published
 * integer weights in evaluate.ts, applied to positions reached by applyMove.
 *
 * It is therefore *not* an objective verdict, and nothing here may be phrased
 * as one. A deeper search would give different numbers, and the honest form of
 * the sentence is always "according to a search of depth N using these
 * weights". A post-mortem that dropped the qualifier would be this project's
 * characteristic way to fail: a confident number with nothing behind it.
 *
 * Only the counterfactual is hypothetical. The game itself is replayed exactly.
 */
export type Regret = {
  /** 1-based, matching the move list the player is looking at. */
  readonly turn: number
  /** Cell actually played. */
  readonly played: number
  /** Best-scoring legal cell at this position. Equal to `played` when the move
   *  played was the best one available. */
  readonly best: number
  readonly playedScore: number
  readonly bestScore: number
  /** `bestScore - playedScore`. Never negative: the move played is one of the
   *  moves considered, so the best is at least as good. */
  readonly cost: number
}

export type PostMortem = {
  readonly player: PlayerId
  /** The depth every score here was produced at. Quote it or say nothing. */
  readonly depth: number
  /** True if the budget ran out before the whole game was reviewed, in which
   *  case `turns` is a prefix and the answer is provisional. */
  readonly partial: boolean
  readonly turns: readonly Regret[]
  /**
   * The last turn at which *some* legal move was still evaluated in this
   * player's favour. After it, nothing they could have played was.
   *
   * This is the answer to "when did I lose", and it is not the same as the
   * biggest blunder. Raw regret is dominated by win-magnitude scores, so the
   * costliest single move is almost always near the end — the turn where a
   * loss already in motion finally became visible to the search. That is a
   * symptom. The point of no return is the question.
   */
  readonly turningPoint: Regret | null
  /**
   * The move that gave up the most against the best alternative at the time.
   * Kept because it is a real and separate thing worth knowing, and labelled
   * as its own thing rather than merged with the above.
   */
  readonly costliest: Regret | null
}

export type ReviewOptions = {
  readonly depth: number
  /** Total budget for the whole review, not per position. */
  readonly budgetMs: number
  readonly now?: () => number
}

export function reviewGame(
  record: GameRecord,
  player: PlayerId,
  options: ReviewOptions,
): PostMortem {
  const now = options.now ?? (() => Date.now())
  const deadline = now() + Math.max(1, options.budgetMs)

  const frames = replayFrames(record)
  const turns: Regret[] = []
  let partial = false

  for (let move = 0; move < record.moves.length; move += 1) {
    const before = frames[move]
    if (before === undefined) break
    // Only this player's own turns. What the opponent could have done instead
    // is a different question and not the one being asked.
    if (before.state.current !== player) continue

    if (now() >= deadline) {
      partial = true
      break
    }

    const played = record.moves[move]
    const scored = scoreMoves(before.state, {
      depth: options.depth,
      // Whatever is left, so one pathological position cannot eat the budget
      // and leave the rest of the game unreviewed without saying so.
      budgetMs: Math.max(1, deadline - now()),
      now,
    })

    if (scored.exhausted) {
      partial = true
      break
    }

    const playedEntry = scored.moves.find((entry) => entry.index === played)
    if (playedEntry === undefined) break

    /*
     * Ties go to the lower cell index, which `scoreMoves` guarantees by
     * returning ascending order — and, when the move played ties for best, to
     * the move played. Reporting "you should have played c4" when what you
     * played was exactly as good would be a lie of presentation.
     */
    let best = playedEntry
    for (const entry of scored.moves) {
      if (entry.score > best.score) best = entry
    }

    turns.push({
      turn: move + 1,
      played,
      best: best.index,
      playedScore: playedEntry.score,
      bestScore: best.score,
      cost: best.score - playedEntry.score,
    })
  }

  /*
   * The point of no return: the last turn holding a move the search still
   * scored in this player's favour. Walking backwards finds it directly, and
   * finding nothing means they were never ahead at any of their own turns —
   * which is a real answer, not a failure, and the caller says so.
   */
  let turningPoint: Regret | null = null
  for (let position = turns.length - 1; position >= 0; position -= 1) {
    if (turns[position].bestScore > 0) {
      turningPoint = turns[position]
      break
    }
  }

  let costliest: Regret | null = null
  for (const turn of turns) {
    // Strictly greater, so the *earliest* of equally costly turns wins. A later
    // mistake on an already-lost board is a consequence, not the cause.
    if (turn.cost > 0 && (costliest === null || turn.cost > costliest.cost)) {
      costliest = turn
    }
  }

  return { player, depth: options.depth, partial, turns, turningPoint, costliest }
}

/**
 * Whether a score means the search saw a forced result rather than an
 * advantage. Win scores are offset by ply, so the test is a band, not equality.
 */
export function isDecisive(score: number): boolean {
  return Math.abs(score) >= DECISIVE
}

/**
 * What the board looked like after the move that was not played.
 *
 * The one place a counterfactual becomes concrete, and it is still the real
 * engine: apply the alternative to the real position and show the result.
 */
export function playAlternative(record: GameRecord, turn: number, index: number) {
  const frames = replayFrames(record)
  const before = frames[turn - 1]
  if (before === undefined) return null
  return applyMove(before.state, { type: 'place', player: before.state.current, index })
}
