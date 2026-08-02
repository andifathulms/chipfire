import type { GameConfig } from '@/lib/engine/state'
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
