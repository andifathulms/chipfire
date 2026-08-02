'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThinkRequest, ThinkResponse } from '@/lib/ai/protocol'
import type { Difficulty } from '@/lib/ai/search'
import type { GameRecord } from '@/lib/engine/replay'

/**
 * Owns the AI worker. Search never runs on the main thread, so a heavy
 * position cannot freeze the board — and there is no main-thread fallback,
 * because a fallback is how "never blocks the UI" quietly stops being true.
 *
 * The worker is sent the config and the move list, never a board. It replays to
 * the position exactly as a peer would.
 */
export const AI_BUDGET_MS = 900

type Options = {
  readonly enabled: boolean
  readonly isAiTurn: boolean
  readonly record: GameRecord
  readonly difficulty: Difficulty
  readonly seed: number
  readonly onMove: (index: number) => void
}

export function useAiOpponent({
  enabled,
  isAiTurn,
  record,
  difficulty,
  seed,
  onMove,
}: Options): { thinking: boolean; error: string | null } {
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return undefined

    const worker = new Worker(new URL('../../workers/ai.worker.ts', import.meta.url))
    workerRef.current = worker

    worker.addEventListener('message', (event: MessageEvent<ThinkResponse>) => {
      const response = event.data
      // A stale reply — the position moved on while it was thinking.
      if (response.id !== requestId.current) return

      setThinking(false)
      if (response.type === 'error') {
        setError(response.message)
        return
      }
      onMoveRef.current(response.index)
    })

    worker.addEventListener('error', (event) => {
      setThinking(false)
      setError(event.message)
    })

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [enabled])

  const moveCount = record.moves.length

  useEffect(() => {
    const worker = workerRef.current
    if (!enabled || !isAiTurn || worker === null) return

    requestId.current += 1
    setThinking(true)

    const request: ThinkRequest = {
      type: 'think',
      id: requestId.current,
      config: record.config,
      moves: record.moves,
      difficulty,
      budgetMs: AI_BUDGET_MS,
      seed: seed + moveCount,
    }
    worker.postMessage(request)
    // moveCount stands in for the position: one request per turn, no re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isAiTurn, moveCount, difficulty, seed])

  return { thinking, error }
}
