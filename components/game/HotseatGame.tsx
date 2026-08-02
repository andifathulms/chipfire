'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { useCascadePlayer, type Speed } from '@/components/cascade/useCascadePlayer'
import { Controls } from '@/components/hud/Controls'
import { Setup } from '@/components/hud/Setup'
import { TurnIndicator } from '@/components/hud/TurnIndicator'
import { useGameSession } from '@/components/game/useGameSession'
import { NO_OWNER } from '@/lib/engine/board'
import { DEFAULT_CONFIG, type GameConfig } from '@/lib/engine/state'
import { copy, type Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

const COPY = {
  title: { id: 'Hotseat', en: 'Hotseat' },
  subtitle: {
    id: 'Satu perangkat, bergantian. Sel kosong atau selmu sendiri.',
    en: 'One device, taking turns. An empty cell or one of your own.',
  },
  wins: { id: 'menang', en: 'wins' },
  again: { id: 'Main lagi', en: 'Play again' },
  turn: { id: 'Langkah', en: 'Move' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
  mass: { id: 'massa kritis', en: 'critical mass' },
} as const

export function HotseatGame({ locale }: { locale: Locale }) {
  const [speed, setSpeed] = useState<Speed>('normal')
  const session = useGameSession(DEFAULT_CONFIG)
  const frames = session.pending?.frames ?? []
  const player = useCascadePlayer(frames, speed, session.settle)

  const view = player.frame ?? session.state.board
  const animating = session.pending !== null
  const finished = session.state.winner !== null && !animating

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

  const applyConfig = (config: GameConfig) => session.reset(config)

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

      <TurnIndicator state={session.state} locale={locale} busy={animating} />

      <div className="relative">
        <Board
          board={session.state.board}
          view={view}
          legal={session.legal}
          exploding={player.frame?.exploding ?? []}
          interactive={!animating && !finished}
          onSelect={session.play}
          labelFor={labelFor}
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

      <p aria-live="polite" className="font-numeral text-xs text-trace-faint">
        {COPY.turn[locale]} {session.state.turn} · {session.hash}
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

      <Setup locale={locale} config={session.config} onApply={applyConfig} />
    </main>
  )
}
