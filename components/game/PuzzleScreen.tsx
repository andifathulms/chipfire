'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { buildFrames } from '@/components/cascade/frames'
import { useCascadePlayer } from '@/components/cascade/useCascadePlayer'
import { applyMove } from '@/lib/engine/apply'
import { NO_OWNER } from '@/lib/engine/board'
import { replay } from '@/lib/engine/replay'
import { legalMoves, type GameState } from '@/lib/engine/state'
import { PUZZLE_COUNT, puzzleAt } from '@/lib/puzzle'
import { copy, type Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

/**
 * One position, one winning move, find it.
 *
 * The tutorial ends with a player who knows the rules and whose only remaining
 * option is losing to the AI. This is the rung between them, and it drills the
 * one thing the rules cannot teach: which cell goes off first.
 *
 * The preview is deliberately off here. Everywhere else in the app it is a
 * teaching aid; on a page whose entire question is "does this move win", a
 * readout that answers "this move wins" on hover is not an aid, it is the
 * answer key. The rest of the screen runs on the real engine exactly as the
 * game does — a wrong move is played, animates, and is shown failing, because
 * seeing why it falls short is the lesson.
 */
const COPY = {
  title: { id: 'Teka-teki', en: 'Puzzles' },
  subtitle: {
    id: 'Satu langkah menang. Cuma ada satu.',
    en: 'One move wins. There is exactly one.',
  },
  puzzle: { id: 'Teka-teki', en: 'Puzzle' },
  of: { id: 'dari', en: 'of' },
  task: {
    id: 'Cari satu langkah yang langsung memenangkan papan ini.',
    en: 'Find the single move that wins this board outright.',
  },
  solved: { id: 'Kena.', en: 'Solved.' },
  solvedBody: {
    id: (explosions: number, captures: number) =>
      `${explosions} ledakan beruntun, ${captures} sel berpindah tangan.`,
    en: (explosions: number, captures: number) =>
      `${explosions} explosions, ${captures} cells changed hands.`,
  },
  missed: { id: 'Belum menang.', en: 'That does not win.' },
  missedBody: {
    id: 'Papan itu hasil dari langkahmu. Lawan masih punya orb.',
    en: 'That board is what your move produced. Your opponent still has orbs.',
  },
  retry: { id: 'Coba lagi', en: 'Try again' },
  next: { id: 'Berikutnya', en: 'Next' },
  done: { id: 'Selesai', en: 'That is all of them' },
  doneBody: {
    id: 'Dua belas selesai. Sisanya lawan yang sungguhan.',
    en: 'Twelve down. The rest is a real opponent.',
  },
  play: { id: 'Main sungguhan', en: 'Play for real' },
  restart: { id: 'Mulai ulang', en: 'Start over' },
  chain: { id: 'Panjang rantai', en: 'Chain length' },
  board: { id: 'Papan teka-teki', en: 'Puzzle board' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
  unavailable: {
    id: 'Teka-teki ini tidak bisa dibuat. Lewati saja.',
    en: 'This puzzle could not be built. Skip it.',
  },
} as const

type Outcome = 'solved' | 'missed'

export function PuzzleScreen({ locale }: { locale: Locale }) {
  const [position, setPosition] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [frames, setFrames] = useState<ReturnType<typeof buildFrames>>([])
  const [played, setPlayed] = useState<GameState | null>(null)

  const puzzle = useMemo(() => puzzleAt(position), [position])
  const start = useMemo(
    () => (puzzle === null ? null : replay({ config: puzzle.config, moves: puzzle.moves })),
    [puzzle],
  )

  const player = useCascadePlayer(frames, 'normal', () => setFrames([]))
  const animating = frames.length > 0
  const finished = position >= PUZZLE_COUNT

  const state = played ?? start
  const view = player.frame ?? state?.board ?? null

  const legal = useMemo(
    () => new Set(state === null || outcome !== null || animating ? [] : legalMoves(state)),
    [state, outcome, animating],
  )

  const reset = (next: number) => {
    setPosition(next)
    setOutcome(null)
    setFrames([])
    setPlayed(null)
  }

  const select = (index: number) => {
    if (start === null || puzzle === null || outcome !== null || animating) return

    const result = applyMove(start, { type: 'place', player: start.current, index })
    setFrames(buildFrames(start.board, result.events))
    setPlayed(result.state)
    // Decided by the engine, not by comparing against the stored answer: the
    // puzzle claims this move wins, and the win is what actually settles it.
    setOutcome(result.state.winner === start.current ? 'solved' : 'missed')
  }

  const labelFor = (index: number) => {
    if (state === null || view === null) return ''
    const row = Math.floor(index / state.board.cols) + 1
    const col = (index % state.board.cols) + 1
    const owner = view.owners[index]
    const where = locale === 'id' ? `Baris ${row} kolom ${col}` : `Row ${row} column ${col}`
    return owner === NO_OWNER
      ? `${where}, ${COPY.empty[locale]}`
      : `${where}, ${COPY.owned[locale]} ${playerName(owner, locale)}, ${view.counts[index]} orb`
  }

  return (
    <main className="mx-auto flex w-full flex-1 max-w-2xl flex-col gap-lg px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-trace-hairline pb-4">
        <div>
          <h1 className="font-numeral text-2xl">{COPY.title[locale]}</h1>
          <p className="text-sm text-trace-soft">{COPY.subtitle[locale]}</p>
        </div>
        <Link href={`/${locale}/`} className="text-sm underline">
          {copy(locale).back}
        </Link>
      </header>

      {/* Progress as a row of ticks, the same shape the tutorial uses. */}
      <ol className="flex gap-1" aria-label={COPY.puzzle[locale]}>
        {Array.from({ length: PUZZLE_COUNT }, (_, slot) => (
          <li
            key={slot}
            aria-current={slot === position ? 'step' : undefined}
            className={[
              'h-1 flex-1 transition-colors',
              slot < position || finished ? 'bg-trace' : slot === position ? 'bg-trace-data' : 'bg-trace-hairline',
            ].join(' ')}
          />
        ))}
      </ol>

      {finished ? (
        <section className="flex flex-col gap-sm">
          <h2 className="font-numeral text-xl">{COPY.done[locale]}</h2>
          <p className="max-w-measure text-base text-trace-soft">{COPY.doneBody[locale]}</p>
          <div className="flex flex-wrap gap-xs">
            <Link
              href={`/${locale}/main/`}
              className="border border-trace bg-trace px-4 py-2 text-sm text-chart transition-opacity hover:opacity-85"
            >
              {COPY.play[locale]}
            </Link>
            <button
              type="button"
              onClick={() => reset(0)}
              className="border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
            >
              {COPY.restart[locale]}
            </button>
          </div>
        </section>
      ) : puzzle === null || state === null || view === null ? (
        <div className="flex flex-col gap-sm">
          <p className="text-sm text-trace-soft">{COPY.unavailable[locale]}</p>
          <button
            type="button"
            onClick={() => reset(position + 1)}
            className="self-start border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
          >
            {COPY.next[locale]}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="label-micro">
              {COPY.puzzle[locale]} {position + 1} {COPY.of[locale]} {PUZZLE_COUNT}
            </p>
            <p className="max-w-measure text-base text-trace-soft">{COPY.task[locale]}</p>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <Board
              board={state.board}
              view={view}
              legal={legal}
              exploding={player.frame?.exploding ?? []}
              converted={player.frame?.converted ?? []}
              frameKey={player.index}
              interactive={outcome === null && !animating}
              onSelect={select}
              labelFor={labelFor}
              label={COPY.board[locale]}
              /*
               * No preview. The readout that helps everywhere else would answer
               * the only question this page asks.
               */
            />
          </div>

          {/* Fixed height so resolving a puzzle does not jog the page. */}
          <div className="flex min-h-[5rem] flex-col gap-sm">
            {outcome === null ? (
              <p className="font-numeral text-sm text-trace-faint">
                {COPY.chain[locale]}: {puzzle.explosions}
              </p>
            ) : outcome === 'solved' ? (
              <div className="flex animate-settle flex-col gap-sm">
                <p className="font-numeral text-lg">{COPY.solved[locale]}</p>
                <p className="text-sm text-trace-soft">
                  {COPY.solvedBody[locale](puzzle.explosions, puzzle.captures)}
                </p>
                <button
                  type="button"
                  onClick={() => reset(position + 1)}
                  className="self-start border border-trace bg-trace px-4 py-2 text-sm text-chart transition-opacity hover:opacity-85"
                >
                  {COPY.next[locale]}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                <p className="font-numeral text-lg">{COPY.missed[locale]}</p>
                <p className="max-w-measure text-sm text-trace-soft">{COPY.missedBody[locale]}</p>
                <button
                  type="button"
                  onClick={() => reset(position)}
                  className="self-start border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
                >
                  {COPY.retry[locale]}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
