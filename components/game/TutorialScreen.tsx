'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { buildFrames } from '@/components/cascade/frames'
import { useCascadePlayer } from '@/components/cascade/useCascadePlayer'
import { applyMove } from '@/lib/engine/apply'
import { NO_OWNER } from '@/lib/engine/board'
import { parseNotation } from '@/lib/engine/notation'
import { previewMove } from '@/lib/engine/preview'
import type { GameState } from '@/lib/engine/state'
import { TUTORIAL } from '@/lib/tutorial'
import { copy, type Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

/**
 * The lesson runs on the real engine and the real board component. Every move
 * the learner makes goes through applyMove and animates off the same event
 * stream as a real game — a tutorial that simulated the game separately would
 * eventually teach something the game does not do.
 */
const COPY = {
  title: { id: 'Belajar', en: 'Learn' },
  subtitle: {
    id: 'Lima langkah, papan kecil. Sekitar dua menit.',
    en: 'Five steps on small boards. About two minutes.',
  },
  step: { id: 'Langkah', en: 'Step' },
  of: { id: 'dari', en: 'of' },
  next: { id: 'Lanjut', en: 'Next' },
  again: { id: 'Coba lagi', en: 'Try again' },
  finishTitle: { id: 'Selesai', en: 'Done' },
  finishBody: {
    id: 'Itu seluruh aturannya. Sisanya soal memilih sel mana yang meledak lebih dulu.',
    en: 'That is all the rules there are. The rest is choosing which cell goes off first.',
  },
  play: { id: 'Main sekarang', en: 'Play now' },
  restart: { id: 'Mulai ulang', en: 'Start over' },
  hint: {
    id: 'Sel yang bisa diklik ditandai. Sel lain sengaja tidak aktif.',
    en: 'The cells you can click are marked. The others are inert on purpose.',
  },
  board: { id: 'Papan latihan', en: 'Practice board' },
  playable: { id: 'bisa dimainkan', en: 'playable' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
} as const

export function TutorialScreen({ locale }: { locale: Locale }) {
  const [position, setPosition] = useState(0)
  const [state, setState] = useState<GameState>(() => parseNotation(TUTORIAL[0].position))
  const [done, setDone] = useState(false)
  const [frames, setFrames] = useState<ReturnType<typeof buildFrames>>([])
  const [hovered, setHovered] = useState<number | null>(null)

  /* Completing a step replaces the hint with buttons that are not where focus
     is. Same failure as the puzzle screen, same fix. */
  const doneRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (done) doneRef.current?.focus()
  }, [done])

  const step = TUTORIAL[position]
  const finished = position >= TUTORIAL.length

  const player = useCascadePlayer(frames, 'normal', () => setFrames([]))
  const animating = frames.length > 0
  const view = player.frame ?? state.board

  const allowed = useMemo(
    () => new Set(done || animating ? [] : (step?.allowed ?? [])),
    [step, done, animating],
  )

  const preview =
    hovered === null || done || animating ? null : previewMove(state, hovered)

  const goTo = (next: number) => {
    setPosition(next)
    setDone(false)
    setFrames([])
    setHovered(null)
    const target = TUTORIAL[next]
    if (target !== undefined) setState(parseNotation(target.position))
  }

  const select = (index: number) => {
    if (step === undefined || done) return
    const result = applyMove(state, { type: 'place', player: state.current, index })
    setFrames(buildFrames(state.board, result.events))
    setState(result.state)
    setDone(true)
    setHovered(null)
  }

  const labelFor = (index: number) => {
    const owner = view.owners[index]
    const playable = allowed.has(index)
    const where =
      locale === 'id'
        ? `Baris ${Math.floor(index / state.board.cols) + 1} kolom ${(index % state.board.cols) + 1}`
        : `Row ${Math.floor(index / state.board.cols) + 1} column ${(index % state.board.cols) + 1}`
    const who =
      owner === NO_OWNER
        ? COPY.empty[locale]
        : `${COPY.owned[locale]} ${playerName(owner, locale)}, ${view.counts[index]} orb`
    return playable ? `${where}, ${who} — ${COPY.playable[locale]}` : `${where}, ${who}`
  }

  return (
    <main className="mx-auto flex w-full flex-1 max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-trace-hairline pb-4">
        <div>
          <h1 className="font-numeral text-3xl">{COPY.title[locale]}</h1>
          <p className="text-sm text-trace-soft">{COPY.subtitle[locale]}</p>
        </div>
        <Link href={`/${locale}/`} className="text-sm underline">
          {copy(locale).back}
        </Link>
      </header>

      {/* Progress as a row of ticks: five steps is short enough to show whole. */}
      <ol className="flex gap-1" aria-label={COPY.step[locale]}>
        {TUTORIAL.map((entry, slot) => (
          <li
            key={entry.id}
            aria-current={slot === position ? 'step' : undefined}
            className={[
              'h-1 flex-1 transition-colors',
              slot < position || finished ? 'bg-trace' : slot === position ? 'bg-trace-data' : 'bg-trace-hairline',
            ].join(' ')}
          />
        ))}
      </ol>

      {step !== undefined ? (
        <>
          <div className="flex flex-col gap-1">
            <p className="label-micro">
              {COPY.step[locale]} {position + 1} {COPY.of[locale]} {TUTORIAL.length}
            </p>
            <h2 className="font-numeral text-xl">{step.title[locale]}</h2>
            <p className="max-w-prose text-sm text-trace-soft">
              {done ? step.result[locale] : step.task[locale]}
            </p>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <Board
              board={state.board}
              view={view}
              legal={allowed}
              exploding={player.frame?.exploding ?? []}
              converted={player.frame?.converted ?? []}
              frameKey={player.index}
              interactive={!done && !animating}
              onSelect={select}
              labelFor={labelFor}
              label={COPY.board[locale]}
              preview={preview}
              previewIndex={hovered}
              onPreview={setHovered}
              markLegal
            />
          </div>

          {/* Fixed height: the hint and the buttons that replace it are the
              same block, so completing a step does not jog the page. */}
          <div className="flex min-h-[2.75rem] items-center">
            {!done ? (
              <p className="text-sm text-trace-soft">{COPY.hint[locale]}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  ref={doneRef}
                  type="button"
                  onClick={() => goTo(position + 1)}
                  className="animate-settle border border-trace bg-trace px-4 py-2 text-sm text-chart transition-opacity hover:opacity-85"
                >
                  {COPY.next[locale]}
                </button>
                <button
                  type="button"
                  onClick={() => goTo(position)}
                  className="border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
                >
                  {COPY.again[locale]}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-numeral text-2xl">{COPY.finishTitle[locale]}</h2>
          <p className="max-w-prose text-sm text-trace-soft">{COPY.finishBody[locale]}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/main/`}
              className="border border-trace bg-trace px-4 py-2 text-sm text-chart transition-opacity hover:opacity-85"
            >
              {COPY.play[locale]}
            </Link>
            <button
              type="button"
              onClick={() => goTo(0)}
              className="border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
            >
              {COPY.restart[locale]}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
