import type { PlayerId } from '@/lib/engine/board'
import type { GameConfig } from '@/lib/engine/state'
import type { PostMortem } from './postmortem'
import type { Difficulty } from './search'

/**
 * Worker messages. The request carries the config and the move list, never a
 * board: the worker replays to the position exactly as a peer would, so there
 * is one reconstruction path in the codebase rather than two.
 */
export type ThinkRequest = {
  readonly type: 'think'
  readonly id: number
  readonly config: GameConfig
  readonly moves: readonly number[]
  readonly difficulty: Difficulty
  readonly budgetMs: number
  readonly seed: number
}

export type ThinkResponse =
  | {
      readonly type: 'move'
      readonly id: number
      readonly index: number
      readonly depth: number
      readonly nodes: number
      readonly elapsedMs: number
    }
  | {
      readonly type: 'error'
      readonly id: number
      readonly message: string
    }

/**
 * Reviewing a finished game. Same shape and same reason as `think`: config and
 * move list, never a board, so the worker replays to each position the one way
 * this codebase reconstructs positions.
 *
 * It goes through the worker rather than running inline because it *is* the
 * search — depth 3 over a long game is around a second of alpha-beta, and
 * invariant 14 does not have an exception for analysis.
 */
export type ReviewRequest = {
  readonly type: 'review'
  readonly id: number
  readonly config: GameConfig
  readonly moves: readonly number[]
  /** Whose game is being reviewed. Their turns are the ones scored. */
  readonly player: PlayerId
  readonly depth: number
  readonly budgetMs: number
}

export type ReviewResponse =
  | {
      readonly type: 'review'
      readonly id: number
      readonly result: PostMortem
    }
  | {
      readonly type: 'error'
      readonly id: number
      readonly message: string
    }

export type WorkerRequest = ThinkRequest | ReviewRequest
export type WorkerResponse = ThinkResponse | ReviewResponse
