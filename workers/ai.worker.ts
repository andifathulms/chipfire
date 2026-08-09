import { chooseMove } from '@/lib/ai/search'
import { reviewGame } from '@/lib/ai/postmortem'
import type { WorkerRequest, WorkerResponse } from '@/lib/ai/protocol'
import { replay } from '@/lib/engine/replay'

/**
 * The only runtime caller of lib/ai. Search never runs on the main thread, so
 * a deep cascade-heavy position cannot freeze the board (PRD §8).
 *
 * Two jobs now: choosing a move during a game, and reviewing one afterwards.
 * The second is the same alpha-beta over many positions instead of one, which
 * is exactly why it belongs here too — invariant 14 has no analysis exemption.
 */
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data

  try {
    if (request.type === 'think') {
      const state = replay({ config: request.config, moves: request.moves })
      const result = chooseMove(state, {
        difficulty: request.difficulty,
        budgetMs: request.budgetMs,
        seed: request.seed,
        now: () => performance.now(),
      })

      const response: WorkerResponse = {
        type: 'move',
        id: request.id,
        index: result.index,
        depth: result.depth,
        nodes: result.nodes,
        elapsedMs: result.elapsedMs,
      }
      self.postMessage(response)
      return
    }

    if (request.type === 'review') {
      const result = reviewGame(
        { config: request.config, moves: request.moves },
        request.player,
        { depth: request.depth, budgetMs: request.budgetMs, now: () => performance.now() },
      )

      const response: WorkerResponse = { type: 'review', id: request.id, result }
      self.postMessage(response)
      return
    }

    const exhaustive: never = request
    throw new Error(`unhandled request: ${JSON.stringify(exhaustive)}`)
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    }
    self.postMessage(response)
  }
})
