'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { useCascadePlayer, type Speed } from '@/components/cascade/useCascadePlayer'
import { Controls } from '@/components/hud/Controls'
import { Setup } from '@/components/hud/Setup'
import { TurnIndicator } from '@/components/hud/TurnIndicator'
import { useGameSession } from '@/components/game/useGameSession'
import { useAiOpponent } from '@/components/game/useAiOpponent'
import { ModePicker, type Mode } from '@/components/hud/ModePicker'
import type { Difficulty } from '@/lib/ai/search'
import { NO_OWNER } from '@/lib/engine/board'
import { DEFAULT_CONFIG, type GameConfig } from '@/lib/engine/state'
import { copy, type Locale } from '@/lib/i18n'
import { playerName, styleFor } from '@/lib/players'
import { GameSummary } from '@/components/hud/GameSummary'
import { HowToPlay } from '@/components/hud/HowToPlay'
import { previewMove, type MovePreview } from '@/lib/engine/preview'
import { EMPTY_STATS, readStats, recordResult, type Stats } from '@/lib/stats'

const COPY = {
  title: { id: 'Main', en: 'Play' },
  subtitle: {
    id: 'Satu perangkat, bergantian.',
    en: 'One device, taking turns.',
  },
  thinking: { id: 'AI berpikir', en: 'AI thinking' },
  confirmTap: {
    id: 'Ketuk lagi untuk menaruh orb.',
    en: 'Tap again to place your orb.',
  },
  board: { id: 'Papan permainan', en: 'Game board' },
  readout: { id: 'Langkah yang dipertimbangkan', en: 'Move under consideration' },
  reach: { id: 'Ledakan', en: 'Explosions' },
  captures: { id: 'Sel direbut', en: 'Cells taken' },
  winning: { id: 'Langkah ini menang', en: 'This move wins' },
  idle: {
    id: 'Arahkan kursor ke sel untuk melihat sejauh mana ledakannya merambat.',
    en: 'Point at a cell to see how far its chain would reach.',
  },
  idleTouch: {
    id: 'Ketuk sel untuk melihat rambatan ledakannya.',
    en: 'Tap a cell to see how far its chain would reach.',
  },
  aiFailed: {
    id: 'AI gagal dijalankan. Ganti ke hotseat untuk melanjutkan.',
    en: 'The AI failed to start. Switch to hotseat to keep playing.',
  },
  wins: { id: 'menang', en: 'wins' },
  again: { id: 'Main lagi', en: 'Play again' },
  finalOrbs: { id: 'orb di akhir', en: 'orbs at the end' },
  inMoves: { id: 'langkah', en: 'moves' },
  turn: { id: 'Langkah', en: 'Move' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
  mass: { id: 'massa kritis', en: 'critical mass' },
  boardSetup: { id: 'Ukuran papan', en: 'Board size' },
} as const

export function PlayScreen({ locale }: { locale: Locale }) {
  const [speed, setSpeed] = useState<Speed>('normal')
  const [mode, setMode] = useState<Mode>('hotseat')
  const [difficulty, setDifficulty] = useState<Difficulty>('sedang')
  const session = useGameSession(DEFAULT_CONFIG)
  const frames = session.pending?.frames ?? []
  const player = useCascadePlayer(frames, speed, session.settle)

  const view = player.frame ?? session.state.board
  const animating = session.pending !== null
  const finished = session.state.winner !== null && !animating

  // Player 0 is the human; everyone else is the machine. It gets no hidden
  // information and no illegal moves — only a deeper search.
  const aiTurn =
    mode === 'ai' && !animating && session.state.winner === null && session.state.current !== 0

  const ai = useAiOpponent({
    enabled: mode === 'ai',
    isAiTurn: aiTurn,
    record: session.record,
    difficulty,
    seed: session.config.seed,
    onMove: session.play,
  })

  const labelFor = (index: number) => {
    const row = Math.floor(index / session.state.board.cols) + 1
    const col = (index % session.state.board.cols) + 1
    const owner = view.owners[index]
    const count = view.counts[index]
    const mass = session.state.board.adjacency.criticalMass[index]
    const where = locale === 'id' ? `Baris ${row} kolom ${col}` : `Row ${row} column ${col}`

    if (owner === NO_OWNER) {
      return `${where}, ${COPY.empty[locale]}, ${COPY.mass[locale]} ${mass}`
    }
    return `${where}, ${COPY.owned[locale]} ${playerName(owner, locale)}, ${count} orb, ${COPY.mass[locale]} ${mass}`
  }

  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const recordedFor = useRef<number>(-1)

  useEffect(() => setStats(readStats()), [])

  // Recorded once per finished game: the move count identifies which one, so a
  // re-render (or a double-invoked effect in development) cannot double-count.
  useEffect(() => {
    if (!finished) return
    const moveCount = session.record.moves.length
    if (recordedFor.current === moveCount) return
    recordedFor.current = moveCount
    const humanWon = mode === 'ai' ? session.state.winner === 0 : true
    setStats(recordResult(mode === 'ai' ? 'ai' : 'hotseat', humanWon, session.longestCascade))
  }, [finished, mode, session.longestCascade, session.record.moves.length, session.state.winner])

  const applyConfig = (config: GameConfig) => session.reset(config)

  // Considered, not committed. The engine answers what the move would do.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [awaitingTap, setAwaitingTap] = useState<number | null>(null)

  const preview: MovePreview | null =
    previewIndex === null || animating || finished ? null : previewMove(session.state, previewIndex)

  const select = (index: number, viaTouch: boolean) => {
    // Touch has no hover, so the first tap shows the reach and the second commits.
    if (viaTouch && awaitingTap !== index) {
      setAwaitingTap(index)
      setPreviewIndex(index)
      return
    }
    setAwaitingTap(null)
    setPreviewIndex(null)
    session.play(index)
  }

  const winner = session.state.winner ?? 0
  const board = session.state.board

  return (
    <main className="mx-auto flex w-full flex-1 max-w-6xl flex-col gap-5 px-4 py-6 lg:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-trace/20 pb-3">
        <div className="flex items-baseline gap-3">
          <Link href={`/${locale}/`} className="font-numeral text-sm text-trace-soft underline">
            Chipfire
          </Link>
          <span aria-hidden="true" className="text-trace-faint">
            /
          </span>
          <h1 className="font-numeral text-2xl leading-none">{COPY.title[locale]}</h1>
          <p className="hidden text-sm text-trace-soft sm:block">{COPY.subtitle[locale]}</p>
        </div>
        <HowToPlay locale={locale} players={session.state.players} />
      </header>

      {ai.error !== null ? (
        <p role="alert" className="border-l-2 border-p1 bg-chart-deep px-3 py-2 text-sm text-p1-ink">
          {COPY.aiFailed[locale]}
        </p>
      ) : null}

      {/*
       * The board is the product, so on a wide screen it takes the space and
       * everything else becomes a rail beside it. The explicit placement keeps
       * the phone order right — whose turn it is has to sit above the board,
       * not below the fold — without rendering the scoreboard twice.
       */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="lg:col-start-2 lg:row-start-1">
          <TurnIndicator state={session.state} locale={locale} busy={animating} />
        </div>

        <div className="flex flex-col gap-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="relative">
            {/*
             * The board is sized to fit the viewport rather than the column, so
             * a tall board never demands a scroll to see the move you are about
             * to make. --chrome is the vertical space the rest of the page needs.
             */}
            <div
              className="mx-auto w-full [--chrome:32rem] sm:[--chrome:27rem] lg:[--chrome:17rem]"
              style={{
                // The max() floor matters: on a short viewport (a phone in
                // landscape) the subtraction goes negative and the board would
                // collapse to nothing.
                maxWidth: `max(15rem, calc((100dvh - var(--chrome)) * ${
                  board.cols / board.rows
                }))`,
              }}
            >
              <Board
                board={board}
                view={view}
                legal={session.legal}
                exploding={player.frame?.exploding ?? []}
                converted={player.frame?.converted ?? []}
                frameKey={player.index}
                interactive={!animating && !finished && !aiTurn}
                onSelect={select}
                labelFor={labelFor}
                label={COPY.board[locale]}
                preview={preview}
                previewIndex={previewIndex}
                onPreview={(index) => {
                  if (awaitingTap !== null) return
                  setPreviewIndex(index)
                }}
              />
            </div>

            {finished ? (
              <div className="absolute inset-0 flex animate-settle flex-col items-center justify-center gap-4 bg-chart/90 px-4 text-center">
                <p className="font-numeral text-3xl">
                  <span className={styleFor(winner).ink}>{playerName(winner, locale)}</span>{' '}
                  {COPY.wins[locale]}
                </p>
                <p className="font-numeral text-sm text-trace-soft">
                  {session.state.orbs[winner]} {COPY.finalOrbs[locale]} ·{' '}
                  {session.record.moves.length} {COPY.inMoves[locale]}
                </p>
                <button
                  type="button"
                  onClick={() => session.reset()}
                  className="border border-trace bg-trace px-5 py-2 text-chart transition-opacity hover:opacity-85"
                >
                  {COPY.again[locale]}
                </button>
              </div>
            ) : null}
          </div>

          {/*
           * The readout is always mounted. Rendering it only while a preview
           * exists made every cell hover shift the whole page beneath the board
           * — in an interface driven entirely by hovering cells.
           */}
          <div
            aria-live="polite"
            className="flex min-h-[3.25rem] items-center gap-5 border border-trace/20 bg-chart-deep/50 px-3 py-2"
          >
            {preview !== null ? (
              <>
                <span className="flex flex-col gap-0.5">
                  <span className="label-micro">{COPY.reach[locale]}</span>
                  <span className="font-numeral text-lg leading-none">{preview.explosions}</span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="label-micro">{COPY.captures[locale]}</span>
                  <span className="font-numeral text-lg leading-none">
                    {preview.capturedCount}
                  </span>
                </span>
                <span className="ml-auto text-right text-sm text-trace-soft">
                  {preview.wins ? (
                    <span className="font-medium text-trace">{COPY.winning[locale]}</span>
                  ) : null}
                  {awaitingTap !== null ? (
                    <span className="block">{COPY.confirmTap[locale]}</span>
                  ) : null}
                </span>
              </>
            ) : (
              <span className="text-sm text-trace-faint">
                <span className="hidden sm:inline">{COPY.idle[locale]}</span>
                <span className="sm:hidden">{COPY.idleTouch[locale]}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-2">
          <ModePicker
            locale={locale}
            mode={mode}
            difficulty={difficulty}
            onMode={(next) => {
              setMode(next)
              session.reset()
            }}
            onDifficulty={setDifficulty}
          />

          <Controls
            locale={locale}
            speed={speed}
            onSpeed={setSpeed}
            onUndo={session.undo}
            onReset={() => session.reset()}
            canUndo={session.record.moves.length > 0 && !animating}
            longestCascade={session.longestCascade}
          />

          {/*
           * Board size is a between-games decision, not a mid-game one, so it
           * folds away instead of competing with the controls that are used
           * every turn.
           */}
          <details className="border-t border-trace/20 pt-3">
            <summary className="label-micro cursor-pointer select-none py-1">
              {COPY.boardSetup[locale]}
            </summary>
            <div className="pt-3">
              <Setup locale={locale} config={session.config} onApply={applyConfig} />
            </div>
          </details>

          <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="label-micro">{COPY.turn[locale]}</span>
            <span className="font-numeral text-trace">{session.state.turn}</span>
            <span className="font-mono text-trace-faint">{session.hash}</span>
            {ai.thinking ? (
              <span className="label-micro animate-pulse text-trace-soft">
                {COPY.thinking[locale]}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {finished ? <GameSummary locale={locale} record={session.record} stats={stats} /> : null}
    </main>
  )
}
