'use client'

import { useCallback, useMemo, useState } from 'react'
import { applyMove } from '@/lib/engine/apply'
import { hashState } from '@/lib/engine/hash'
import { countExplosions, type GameEvent } from '@/lib/engine/events'
import { createGame, legalMoves, type GameConfig, type GameState } from '@/lib/engine/state'
import { replay, toMove, type GameRecord } from '@/lib/engine/replay'
import { buildFrames, type Frame } from '@/components/cascade/frames'

/**
 * Session state for a game played on one device.
 *
 * The engine is the truth: a move is applied immediately and the animation
 * replays the event stream that came back. Undo is a replay of the move list
 * minus its last entry, which is correct by construction — a game *is* its
 * move list (PRD §6).
 */
export type Pending = {
  readonly frames: readonly Frame[]
  readonly events: readonly GameEvent[]
}

export type Session = {
  readonly config: GameConfig
  readonly state: GameState
  readonly record: GameRecord
  readonly pending: Pending | null
  readonly legal: ReadonlySet<number>
  readonly hash: string
  readonly longestCascade: number
  /** Returns the resulting state, or null if the move was refused. The caller
   *  needs it to hash the position for the peer. */
  play: (index: number) => GameState | null
  /** Adopt a move list wholesale — replay, never a transplanted board. */
  load: (moves: readonly number[]) => GameState
  settle: () => void
  undo: () => void
  reset: (config?: GameConfig) => void
}

export function useGameSession(initial: GameConfig): Session {
  const [config, setConfig] = useState(initial)
  const [state, setState] = useState(() => createGame(initial))
  const [moves, setMoves] = useState<readonly number[]>([])
  const [pending, setPending] = useState<Pending | null>(null)
  const [longestCascade, setLongestCascade] = useState(0)

  const play = useCallback(
    (index: number) => {
      // Guarded here rather than inside a state updater: updaters must stay
      // pure, and React runs them twice in development.
      if (state.winner !== null || pending !== null) return null

      const result = applyMove(state, toMove(state, index))

      setState(result.state)
      setMoves((list) => [...list, index])
      setPending({ frames: buildFrames(state.board, result.events), events: result.events })
      setLongestCascade((best) => Math.max(best, countExplosions(result.events)))

      return result.state
    },
    [pending, state],
  )

  const settle = useCallback(() => setPending(null), [])

  const load = useCallback(
    (next: readonly number[]) => {
      const rebuilt = replay({ config, moves: next })
      setMoves(next)
      setState(rebuilt)
      setPending(null)
      return rebuilt
    },
    [config],
  )

  const undo = useCallback(() => {
    if (moves.length === 0) return
    const shortened = moves.slice(0, -1)
    setMoves(shortened)
    setState(replay({ config, moves: shortened }))
    setPending(null)
  }, [config, moves])

  const reset = useCallback((next?: GameConfig) => {
    const target = next ?? config
    setConfig(target)
    setState(createGame(target))
    setMoves([])
    setPending(null)
    setLongestCascade(0)
  }, [config])

  const legal = useMemo(() => new Set(legalMoves(state)), [state])
  const hash = useMemo(() => hashState(state), [state])
  const record = useMemo<GameRecord>(() => ({ config, moves }), [config, moves])

  return {
    config,
    state,
    record,
    pending,
    legal,
    hash,
    longestCascade,
    play,
    load,
    settle,
    undo,
    reset,
  }
}
