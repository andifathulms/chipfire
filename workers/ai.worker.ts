import { chooseMove } from '@/lib/ai/search'
import type { ThinkRequest, ThinkResponse } from '@/lib/ai/protocol'
import { replay } from '@/lib/engine/replay'

/**
 * The only runtime caller of lib/ai. Search never runs on the main thread, so
 * a deep cascade-heavy position cannot freeze the board (PRD §8).
 */
self.addEventListener('message', (event: MessageEvent<ThinkRequest>) => {
  const request = event.data
  if (request.type !== 'think') return

  try {
    const state = replay({ config: request.config, moves: request.moves })
    const result = chooseMove(state, {
      difficulty: request.difficulty,
      budgetMs: request.budgetMs,
      seed: request.seed,
      now: () => performance.now(),
    })

    const response: ThinkResponse = {
      type: 'move',
      id: request.id,
      index: result.index,
      depth: result.depth,
      nodes: result.nodes,
      elapsedMs: result.elapsedMs,
    }
    self.postMessage(response)
  } catch (error) {
    const response: ThinkResponse = {
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    }
    self.postMessage(response)
  }
})
