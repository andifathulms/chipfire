'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReviewRequest, WorkerResponse } from '@/lib/ai/protocol'
import type { PostMortem } from '@/lib/ai/postmortem'
import type { PlayerId } from '@/lib/engine/board'
import type { GameRecord } from '@/lib/engine/replay'

/**
 * Reviewing a finished game, off the main thread.
 *
 * A worker of its own rather than the opponent's, and only spun up when asked.
 * The AI worker's lifetime is tied to being in AI mode, and this has to work in
 * hotseat too — where there is no opponent worker at all.
 */

/** Deep enough to see a cascade coming, shallow enough to finish while someone
 *  is still looking at the screen. Quoted in the UI, never hidden. */
export const REVIEW_DEPTH = 3

/** The whole review, not per position. A long game that would overrun comes
 *  back partial and says so, rather than running until the tab is closed. */
export const REVIEW_BUDGET_MS = 8_000

export type ReviewState = {
  readonly running: boolean
  readonly result: PostMortem | null
  readonly error: string | null
  run: (record: GameRecord, player: PlayerId) => void
  clear: () => void
}

export function useGameReview(): ReviewState {
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<PostMortem | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Nothing is created until someone asks for a review, so a player who never
  // opens one never pays for the worker.
  const ensureWorker = useCallback(() => {
    if (workerRef.current !== null) return workerRef.current

    const worker = new Worker(new URL('../../workers/ai.worker.ts', import.meta.url))

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const response = event.data
      if (response.id !== requestId.current) return

      if (response.type === 'error') {
        setRunning(false)
        setError(response.message)
        return
      }
      // A 'move' reply on this worker would mean a request this hook never
      // sent; ignoring it is safer than rendering it as a review.
      if (response.type !== 'review') return

      setRunning(false)
      setResult(response.result)
    })

    worker.addEventListener('error', (event) => {
      setRunning(false)
      setError(event.message)
    })

    workerRef.current = worker
    return worker
  }, [])

  const run = useCallback(
    (record: GameRecord, player: PlayerId) => {
      const worker = ensureWorker()
      requestId.current += 1
      setRunning(true)
      setError(null)
      setResult(null)

      const request: ReviewRequest = {
        type: 'review',
        id: requestId.current,
        config: record.config,
        moves: record.moves,
        player,
        depth: REVIEW_DEPTH,
        budgetMs: REVIEW_BUDGET_MS,
      }
      worker.postMessage(request)
    },
    [ensureWorker],
  )

  const clear = useCallback(() => {
    // Bumped so a reply already in flight is discarded rather than arriving
    // over a game that has since been restarted.
    requestId.current += 1
    setRunning(false)
    setResult(null)
    setError(null)
  }, [])

  useEffect(
    () => () => {
      workerRef.current?.terminate()
      workerRef.current = null
    },
    [],
  )

  return { running, result, error, run, clear }
}
