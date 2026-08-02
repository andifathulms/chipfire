'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { replayFrames, type GameRecord } from '@/lib/engine/replay'
import { countExplosions } from '@/lib/engine/events'
import { NO_OWNER } from '@/lib/engine/board'
import { codeFromHash, decodeRecord, RecordCodeError } from '@/lib/share'
import { copy, type Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

/**
 * A game is its move list, so the replay viewer needs nothing hosted anywhere:
 * paste the code (or follow a link carrying it in the URL hash) and every
 * position is reconstructed by replay.
 */
const COPY = {
  title: { id: 'Ulang', en: 'Replay' },
  intro: {
    id: 'Tempel kode permainan. Tidak ada yang disimpan di server — kodenya adalah permainannya.',
    en: 'Paste a game code. Nothing is stored on a server — the code is the game.',
  },
  load: { id: 'Muat', en: 'Load' },
  step: { id: 'Langkah', en: 'Move' },
  prev: { id: 'Mundur', en: 'Back' },
  next: { id: 'Maju', en: 'Forward' },
  explosions: { id: 'ledakan', en: 'explosions' },
  wins: { id: 'menang', en: 'wins' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
} as const

export function ReplayScreen({ locale }: { locale: Locale }) {
  const [code, setCode] = useState('')
  const [record, setRecord] = useState<GameRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  const load = (value: string) => {
    try {
      setRecord(decodeRecord(value))
      setStep(0)
      setError(null)
    } catch (cause) {
      setRecord(null)
      setError(cause instanceof RecordCodeError ? cause.message : String(cause))
    }
  }

  // A shared link carries the code in the hash; nothing is fetched.
  useEffect(() => {
    const fromHash = codeFromHash(window.location.hash)
    if (fromHash === null) return
    setCode(fromHash)
    load(fromHash)
  }, [])

  const frames = useMemo(() => (record === null ? [] : replayFrames(record)), [record])
  const frame = frames[Math.min(step, Math.max(0, frames.length - 1))]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-trace/20 pb-4">
        <div>
          <h1 className="font-numeral text-3xl">{COPY.title[locale]}</h1>
          <p className="max-w-prose text-sm text-trace-soft">{COPY.intro[locale]}</p>
        </div>
        <Link href={`/${locale}/`} className="text-sm underline">
          {copy(locale).back}
        </Link>
      </header>

      <form
        className="flex flex-wrap items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          load(code)
        }}
      >
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          rows={2}
          spellCheck={false}
          className="min-w-[16rem] flex-1 resize-none border border-trace/30 bg-chart p-2 font-mono text-xs"
        />
        <button
          type="submit"
          className="border border-trace px-3 py-2 text-sm transition-colors hover:bg-chart-deep"
        >
          {COPY.load[locale]}
        </button>
      </form>

      {error !== null ? (
        <p role="alert" className="border border-p1 px-3 py-2 text-sm text-p1">
          {error}
        </p>
      ) : null}

      {frame !== undefined && record !== null ? (
        <>
          <Board
            board={frame.state.board}
            view={frame.state.board}
            legal={new Set()}
            exploding={[]}
            interactive={false}
            onSelect={() => undefined}
            labelFor={(index) => {
              const owner = frame.state.board.owners[index]
              if (owner === NO_OWNER) return COPY.empty[locale]
              return `${COPY.owned[locale]} ${playerName(owner, locale)}`
            }}
          />

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              className="border border-trace/30 px-3 py-1 transition-colors hover:bg-chart-deep disabled:opacity-40"
            >
              {COPY.prev[locale]}
            </button>
            <button
              type="button"
              onClick={() => setStep((value) => Math.min(frames.length - 1, value + 1))}
              disabled={step >= frames.length - 1}
              className="border border-trace/30 px-3 py-1 transition-colors hover:bg-chart-deep disabled:opacity-40"
            >
              {COPY.next[locale]}
            </button>
            <span className="font-numeral text-xs text-trace-soft">
              {COPY.step[locale]} {step} / {frames.length - 1} · {countExplosions(frame.events)}{' '}
              {COPY.explosions[locale]} · {frame.hash}
            </span>
            {frame.state.winner !== null ? (
              <span className="font-numeral text-sm">
                {playerName(frame.state.winner, locale)} {COPY.wins[locale]}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  )
}
