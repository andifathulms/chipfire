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
import { playerName } from '@/lib/players'
import { GameSummary } from '@/components/hud/GameSummary'
import { HowToPlay } from '@/components/hud/HowToPlay'
import { previewMove, type MovePreview } from '@/lib/engine/preview'
import { EMPTY_STATS, readStats, recordResult, type Stats } from '@/lib/stats'

const COPY = {
  title: { id: 'Main', en: 'Play' },
  subtitle: {
    id: 'Satu perangkat, bergantian. Sel kosong atau selmu sendiri.',
    en: 'One device, taking turns. An empty cell or one of your own.',
  },
  thinking: { id: 'AI berpikir', en: 'AI thinking' },
  confirmTap: {
    id: 'Ketuk sekali lagi di sel yang sama untuk menaruh orb.',
    en: 'Tap the same cell once more to place your orb.',
  },
  reach: { id: 'ledakan beruntun', en: 'chained explosions' },
  captures: { id: 'sel direbut', en: 'cells captured' },
  winning: { id: 'langkah ini memenangkan permainan', en: 'this move wins the game' },
  aiFailed: {
    id: 'AI gagal dijalankan. Ganti ke hotseat untuk melanjutkan.',
    en: 'The AI failed to start. Switch to hotseat to keep playing.',
  },
  wins: { id: 'menang', en: 'wins' },
  again: { id: 'Main lagi', en: 'Play again' },
  turn: { id: 'Langkah', en: 'Move' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
  mass: { id: 'massa kritis', en: 'critical mass' },
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-trace/20 pb-4">
        <div>
          <h1 className="font-numeral text-3xl">{COPY.title[locale]}</h1>
          <p className="text-sm text-trace-soft">{COPY.subtitle[locale]}</p>
        </div>
        <Link href={`/${locale}/`} className="text-sm underline">
          {copy(locale).back}
        </Link>
      </header>

      <HowToPlay locale={locale} players={session.state.players} />

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

      <TurnIndicator state={session.state} locale={locale} busy={animating} />

      {ai.error !== null ? (
        <p role="alert" className="border border-p1 px-3 py-2 text-sm text-p1">
          {COPY.aiFailed[locale]}
        </p>
      ) : null}

      <div className="relative">
        <Board
          board={session.state.board}
          view={view}
          legal={session.legal}
          exploding={player.frame?.exploding ?? []}
          interactive={!animating && !finished && !aiTurn}
          onSelect={select}
          labelFor={labelFor}
          preview={preview}
          previewIndex={previewIndex}
          onPreview={(index) => {
            if (awaitingTap !== null) return
            setPreviewIndex(index)
          }}
        />

        {finished ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-chart/85">
            <p className="font-numeral text-2xl">
              {playerName(session.state.winner ?? 0, locale)} {COPY.wins[locale]}
            </p>
            <button
              type="button"
              onClick={() => session.reset()}
              className="border border-trace px-4 py-2 transition-colors hover:bg-chart-deep"
            >
              {COPY.again[locale]}
            </button>
          </div>
        ) : null}
      </div>

      {preview !== null ? (
        <p className="font-numeral text-xs text-trace-soft">
          {preview.explosions} {COPY.reach[locale]} · {preview.capturedCount} {COPY.captures[locale]}
          {preview.wins ? ` · ${COPY.winning[locale]}` : ''}
          {awaitingTap !== null ? ` · ${COPY.confirmTap[locale]}` : ''}
        </p>
      ) : null}

      <p aria-live="polite" className="font-numeral text-xs text-trace-faint">
        {COPY.turn[locale]} {session.state.turn} · {session.hash}
        {ai.thinking ? ` · ${COPY.thinking[locale]}` : ''}
      </p>

      <Controls
        locale={locale}
        speed={speed}
        onSpeed={setSpeed}
        onUndo={session.undo}
        onReset={() => session.reset()}
        canUndo={session.record.moves.length > 0 && !animating}
        longestCascade={session.longestCascade}
      />

      {finished ? <GameSummary locale={locale} record={session.record} stats={stats} /> : null}

      <Setup locale={locale} config={session.config} onApply={applyConfig} />
    </main>
  )
}
