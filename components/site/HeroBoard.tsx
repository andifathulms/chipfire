'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '@/components/board/Board'
import { buildFrames, type Frame } from '@/components/cascade/frames'
import { useCascadePlayer, useReducedMotion } from '@/components/cascade/useCascadePlayer'
import { TurnIndicator } from '@/components/hud/TurnIndicator'
import { applyMove } from '@/lib/engine/apply'
import { NO_OWNER } from '@/lib/engine/board'
import { toMove } from '@/lib/engine/replay'
import { createGame, legalMoves, type GameState } from '@/lib/engine/state'
import type { Locale } from '@/lib/i18n'

/**
 * The home page's live board: a real game, played by two random players, run
 * by the real engine and drawn by the real Board and cascade player. Nothing
 * here is an animation of a game — every frame is `applyMove` output, which
 * is the most honest way to show what the game looks like.
 *
 * The players are not the AI. They pick uniformly among legal moves, leaning
 * toward cells already one orb from firing so that chains happen often enough
 * to be worth watching. The randomness is a seeded generator local to this
 * component and has nothing to do with the engine, which stays pure.
 *
 * Decorative to assistive tech and unreachable by keyboard (`inert`): the
 * rules beneath it say the same thing in words, and fifty-four buttons that do
 * nothing would be a trap in the tab order.
 */
const ROWS = 5
const COLS = 6
/** A game that has not ended by this many moves starts over. */
const MAX_MOVES = 60
const THINK_MS = 650
const HOLD_WIN_MS = 2600
/** Under reduced motion the board shows one still position this far in. */
const STILL_AT = 18

function nextRandom(seed: number): number {
  // A 31-bit LCG: plenty for choosing demo moves, and deterministic.
  return (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff
}

function chooseMove(state: GameState, seed: number): { index: number; seed: number } {
  const legal = legalMoves(state)
  const board = state.board
  const primed = legal.filter(
    (index) =>
      board.owners[index] === state.current &&
      board.counts[index] === board.adjacency.criticalMass[index] - 1,
  )
  let s = nextRandom(seed)
  const pool = primed.length > 0 && s % 100 < 55 ? primed : legal
  s = nextRandom(s)
  return { index: pool[s % pool.length] ?? legal[0] ?? 0, seed: s }
}

function freshGame(seed: number): GameState {
  return createGame({ rows: ROWS, cols: COLS, players: 2, seed })
}

export function HeroBoard({ locale }: { locale: Locale }) {
  const reduced = useReducedMotion()
  const [game, setGame] = useState<GameState>(() => freshGame(1))
  const [lastMove, setLastMove] = useState<number | null>(null)
  const [pending, setPending] = useState<{ frames: Frame[]; next: GameState } | null>(null)
  const seedRef = useRef(20251014)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    wrapperRef.current?.setAttribute('inert', '')
  }, [])

  const frames = useMemo(() => pending?.frames ?? [], [pending])
  const player = useCascadePlayer(frames, 'normal', () => {
    if (pending === null) return
    setGame(pending.next)
    setPending(null)
  })

  // Under reduced motion: one still, mid-game position and nothing moving.
  useEffect(() => {
    if (!reduced) return
    let state = freshGame(1)
    let seed = seedRef.current
    let last: number | null = null
    for (let move = 0; move < STILL_AT && state.winner === null; move += 1) {
      const choice = chooseMove(state, seed)
      seed = choice.seed
      last = choice.index
      state = applyMove(state, toMove(state, choice.index)).state
    }
    setPending(null)
    setGame(state)
    setLastMove(last)
  }, [reduced])

  // The loop: think, move, let the cascade play, repeat; start over at a win.
  useEffect(() => {
    if (reduced || pending !== null) return undefined

    const over = game.winner !== null || game.turn >= MAX_MOVES
    const timer = window.setTimeout(
      () => {
        if (over) {
          seedRef.current = nextRandom(seedRef.current)
          setGame(freshGame(1))
          setLastMove(null)
          return
        }
        const choice = chooseMove(game, seedRef.current)
        seedRef.current = choice.seed
        const result = applyMove(game, toMove(game, choice.index))
        setLastMove(choice.index)
        setPending({ frames: buildFrames(game.board, result.events), next: result.state })
      },
      over ? HOLD_WIN_MS : THINK_MS,
    )
    return () => window.clearTimeout(timer)
  }, [game, pending, reduced])

  const view = player.frame ?? game.board
  const finished = game.winner !== null && pending === null

  return (
    <div ref={wrapperRef} aria-hidden="true" className="flex flex-col gap-3">
      <TurnIndicator state={pending?.next ?? game} locale={locale} busy={pending !== null} />
      <Board
        board={game.board}
        view={view}
        legal={new Set()}
        exploding={player.frame?.exploding ?? []}
        converted={player.frame?.converted ?? []}
        frameKey={player.index}
        interactive={false}
        onSelect={() => undefined}
        labelFor={(index) => (view.owners[index] === NO_OWNER ? '' : String(view.counts[index]))}
        lastMove={lastMove}
        turn={finished ? null : (player.frame?.mover ?? game.current)}
        mover={player.frame?.mover ?? null}
        chain={player.frame?.chain ?? 0}
        flood={finished}
      />
    </div>
  )
}
