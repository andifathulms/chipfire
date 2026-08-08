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

/**
 * A floor on how long a turn takes, which is a interface concern rather than a
 * search one. `mudah` searches to depth 1 and returns in single-digit
 * milliseconds, so without this the player's cascade settles and the AI's
 * begins in the same visual instant — the two read as one event, and the
 * opponent's move looks like explosions arriving from nowhere. Worst on the
 * easiest setting, which is exactly where a new player starts.
 *
 * The pause is not fake computation: it is the beat that makes the turn
 * boundary perceivable. It applies under reduced motion too, where the cascade
 * resolves instantly and the boundary would otherwise vanish entirely.
 */
export const AI_MIN_TURN_MS = 500

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

  // When the current request was posted, and the timer holding back a reply
  // that came back faster than AI_MIN_TURN_MS.
  const askedAt = useRef(0)
  const holdRef = useRef<number | null>(null)

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

      if (response.type === 'error') {
        setThinking(false)
        setError(response.message)
        return
      }

      // Held back to the floor, so a shallow search still reads as a turn.
      // `thinking` stays true for the whole wait — the indicator is the point.
      const waited = performance.now() - askedAt.current
      const index = response.index
      holdRef.current = window.setTimeout(
        () => {
          holdRef.current = null
          setThinking(false)
          onMoveRef.current(index)
        },
        Math.max(0, AI_MIN_TURN_MS - waited),
      )
    })

    worker.addEventListener('error', (event) => {
      setThinking(false)
      setError(event.message)
    })

    return () => {
      // The held reply must die with the worker, or a move lands on a board
      // that has since been reset or switched out of AI mode.
      if (holdRef.current !== null) {
        window.clearTimeout(holdRef.current)
        holdRef.current = null
      }
      worker.terminate()
      workerRef.current = null
    }
  }, [enabled])

  const moveCount = record.moves.length

  useEffect(() => {
    const worker = workerRef.current
    if (!enabled || !isAiTurn || worker === null) return

    // A reply still being held back belongs to the previous position. Undo can
    // change the position while the AI is mid-turn, and letting that timer fire
    // afterwards would play a move chosen for a board that no longer exists.
    if (holdRef.current !== null) {
      window.clearTimeout(holdRef.current)
      holdRef.current = null
    }

    requestId.current += 1
    askedAt.current = performance.now()
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

  /*
   * The turn stopped being the AI's while a reply was held back — a restart, a
   * new board, or a switch to hotseat. Nothing may be played into that: the
   * held index was chosen for a position that is gone, and dropping it onto the
   * fresh one would place an orb on the human's turn.
   */
  useEffect(() => {
    if (enabled && isAiTurn) return
    if (holdRef.current === null) return
    window.clearTimeout(holdRef.current)
    holdRef.current = null
    setThinking(false)
  }, [enabled, isAiTurn])

  return { thinking, error }
}
