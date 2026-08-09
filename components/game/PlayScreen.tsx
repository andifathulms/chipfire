'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { useCascadePlayer, type Speed } from '@/components/cascade/useCascadePlayer'
import { useCascadeReview } from '@/components/cascade/useCascadeReview'
import { Controls } from '@/components/hud/Controls'
import { Setup } from '@/components/hud/Setup'
import { TurnIndicator } from '@/components/hud/TurnIndicator'
import { useGameSession } from '@/components/game/useGameSession'
import { useGameReview } from '@/components/game/useGameReview'
import { useAiOpponent } from '@/components/game/useAiOpponent'
import { ModePicker, type Mode } from '@/components/hud/ModePicker'
import type { Difficulty } from '@/lib/ai/search'
import { NO_OWNER } from '@/lib/engine/board'
import { DEFAULT_CONFIG, type GameConfig } from '@/lib/engine/state'
import { copy, type Locale } from '@/lib/i18n'
import { playerName, styleFor } from '@/lib/players'
import { GameSummary } from '@/components/hud/GameSummary'
import { LoadGauge } from '@/components/hud/LoadGauge'
import { MoveList } from '@/components/hud/MoveList'
import { CascadeReplay } from '@/components/hud/CascadeReplay'
import { EvaluationPanel } from '@/components/hud/EvaluationPanel'
import { PostMortemPanel } from '@/components/hud/PostMortemPanel'
import { HowToPlay } from '@/components/hud/HowToPlay'
import { Wordmark } from '@/components/site/Mark'
import { previewMove, type MovePreview } from '@/lib/engine/preview'
import { EMPTY_STATS, readStats, recordResult, type Stats } from '@/lib/stats'
import { playWin } from '@/lib/sound'
import { readPreviewEnabled, setPreviewEnabled } from '@/lib/settings'

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
  previewOff: {
    id: 'Pratinjau ledakan dimatikan.',
    en: 'Cascade preview is off.',
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
  evaluation: { id: 'Penilaian AI', en: "The AI's evaluation" },
  lastMove: { id: 'langkah terakhir', en: 'last move' },
} as const

export function PlayScreen({ locale }: { locale: Locale }) {
  const [speed, setSpeed] = useState<Speed>('normal')
  const [mode, setMode] = useState<Mode>('hotseat')
  const [difficulty, setDifficulty] = useState<Difficulty>('sedang')
  const session = useGameSession(DEFAULT_CONFIG)
  const frames = session.pending?.frames ?? []

  /*
   * Whether the move now animating was the machine's. Its placement frame is
   * held roughly twice as long as your own, because on your move you already
   * know where you played and on theirs that frame is the only thing that says
   * so before the chain runs.
   */
  const [lastMoveWasAi, setLastMoveWasAi] = useState(false)
  const player = useCascadePlayer(frames, speed, session.settle, lastMoveWasAi ? 3 : 1.6)

  /*
   * Watching the last cascade back. A separate clock from the one above: that
   * one is part of taking a turn, this one steps through a recording of one.
   */
  const review = useCascadeReview(session.lastCascade?.frames ?? [], speed)

  // Review wins over the live player — you cannot be reviewing and animating at
  // the same time, because opening a review is only offered once one has ended.
  const view = review.frame ?? player.frame ?? session.state.board
  const animating = session.pending !== null
  const finished = session.state.winner !== null && !animating

  // Player 0 is the human; everyone else is the machine. It gets no hidden
  // information and no illegal moves — only a deeper search.
  // `!review.open` matters: without it the machine takes its turn under a board
  // that is currently showing a recording, and the move lands somewhere the
  // player is not looking.
  const aiTurn =
    mode === 'ai' &&
    !animating &&
    !review.open &&
    session.state.winner === null &&
    session.state.current !== 0

  const ai = useAiOpponent({
    enabled: mode === 'ai',
    isAiTurn: aiTurn,
    record: session.record,
    difficulty,
    seed: session.config.seed,
    onMove: (index) => {
      setLastMoveWasAi(true)
      session.play(index)
    },
  })

  const labelFor = (index: number) => {
    const row = Math.floor(index / session.state.board.cols) + 1
    const col = (index % session.state.board.cols) + 1
    const owner = view.owners[index]
    const count = view.counts[index]
    const mass = session.state.board.adjacency.criticalMass[index]
    const where = locale === 'id' ? `Baris ${row} kolom ${col}` : `Row ${row} column ${col}`
    // The registration marks are invisible to a screen reader, and "where did
    // they just play" is the same question however you are reading the board.
    const played = session.record.moves.at(-1) === index ? `, ${COPY.lastMove[locale]}` : ''

    if (owner === NO_OWNER) {
      return `${where}, ${COPY.empty[locale]}, ${COPY.mass[locale]} ${mass}${played}`
    }
    return `${where}, ${COPY.owned[locale]} ${playerName(owner, locale)}, ${count} orb, ${COPY.mass[locale]} ${mass}${played}`
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
    setStats(
      recordResult(
        mode === 'ai' ? 'ai' : 'hotseat',
        humanWon,
        session.longestCascade,
        // Every cascade of the game just finished, so the distribution is built
        // from moves rather than from one number per game.
        session.history.map((move) => move.explosions),
      ),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, mode, session.longestCascade, session.record.moves.length, session.state.winner])

  /*
   * Reviewed from the losing side, because "when did I lose" is the question.
   * Two players only: with three or four there are several losers and no single
   * perspective the panel could be speaking from without saying whose.
   */
  const postMortem = useGameReview()
  const reviewSubject =
    session.state.players === 2 && session.state.winner !== null
      ? ((session.state.winner === 0 ? 1 : 0) as 0 | 1)
      : null

  /*
   * A review belongs to the game it reviewed. Starting another one — restart,
   * new board size, switching opponent — has to drop it, or the next game ends
   * showing a turning point from the last one.
   */
  /*
   * The win figure. Not a frame, so it cannot come off the cascade player like
   * the rest of the sound does — it fires once when the game is decided, keyed
   * on the move count so a re-render cannot sound it twice.
   */
  const soundedWinAt = useRef(-1)
  useEffect(() => {
    if (!finished) return
    if (soundedWinAt.current === session.record.moves.length) return
    soundedWinAt.current = session.record.moves.length
    playWin()
  }, [finished, session.record.moves.length])

  const clearReview = postMortem.clear
  useEffect(() => {
    if (!finished) clearReview()
  }, [finished, clearReview])

  const applyConfig = (config: GameConfig) => session.reset(config)

  // Considered, not committed. The engine answers what the move would do.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [awaitingTap, setAwaitingTap] = useState<number | null>(null)

  /*
   * Read after mount rather than during render: the page is statically
   * exported, so the server cannot know this device's preference and rendering
   * a guess would flash the wrong state. On until told otherwise (PRD §9.2).
   */
  const [previewOn, setPreviewOn] = useState(true)
  useEffect(() => setPreviewOn(readPreviewEnabled()), [])

  // A preview left over from before a review was opened would be drawn on top
  // of a recording, describing a move against a position that is not on screen.
  const preview: MovePreview | null =
    !previewOn || previewIndex === null || animating || finished || review.open
      ? null
      : previewMove(session.state, previewIndex)

  const select = (index: number, viaTouch: boolean) => {
    /*
     * Touch has no hover, so the first tap shows the reach and the second
     * commits — but only when there is a reach to show. With the preview off
     * the first tap would reveal nothing, and demanding a second one would be
     * a confirmation step that exists for no reason.
     */
    if (previewOn && viaTouch && awaitingTap !== index) {
      setAwaitingTap(index)
      setPreviewIndex(index)
      return
    }
    setAwaitingTap(null)
    setPreviewIndex(null)
    setLastMoveWasAi(false)
    session.play(index)
  }

  const winner = session.state.winner ?? 0
  const board = session.state.board

  return (
    <main className="mx-auto flex w-full flex-1 max-w-6xl flex-col gap-5 px-4 py-6 lg:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-trace-hairline pb-3">
        <div className="flex items-baseline gap-3">
          <Link
            href={`/${locale}/`}
            className="font-numeral text-sm text-trace-soft transition-colors hover:text-trace"
          >
            <Wordmark nameClassName="underline" />
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
          <TurnIndicator
            state={session.state}
            locale={locale}
            busy={animating}
            thinkingPlayer={ai.thinking ? session.state.current : null}
          />
        </div>

        <div className="flex flex-col gap-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="relative">
            {/*
             * The board is sized to fit the viewport rather than the column, so
             * a tall board never demands a scroll to see the move you are about
             * to make. --chrome is the vertical space everything else needs.
             *
             * What it accounts for, so the next person to add a panel knows
             * whether they have invalidated it:
             *
             *   page padding      py-6                      3rem
             *   header + rule     text-2xl + pb-3          ~3rem
             *   gap               gap-5                    1.25rem
             *   turn indicator    label + player cards     ~6rem
             *   gap               gap-5                    1.25rem
             *   [board]
             *   gap               gap-3                    0.75rem
             *   readout           min-h-[3.25rem]          3.25rem
             *   site footer       shared, outside <main>   ~4rem
             *
             * Everything else in the rail sits below the readout and is below
             * the fold by design, which is why this session's additions —
             * the gauge, the cascade replay, the move list — did not move it.
             * On lg the rail is a side column and only the header, readout and
             * footer are stacked with the board, hence the much smaller value.
             *
             * The calc only binds on short, wide viewports; elsewhere the
             * column width caps the board first. UNVERIFIED against a real
             * browser — the numbers are estimates from the classes above, and
             * a landscape phone is the case to check.
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
                exploding={review.frame?.exploding ?? player.frame?.exploding ?? []}
                converted={review.frame?.converted ?? player.frame?.converted ?? []}
                frameKey={review.open ? -review.index - 1 : player.index}
                interactive={!animating && !finished && !aiTurn && !review.open}
                onSelect={select}
                labelFor={labelFor}
                label={COPY.board[locale]}
                lastMove={session.record.moves.at(-1) ?? null}
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
            className="flex min-h-[3.25rem] items-center gap-5 border border-trace-hairline bg-chart-deep/50 px-3 py-2"
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
                {previewOn ? (
                  <>
                    <span className="hidden sm:inline">{COPY.idle[locale]}</span>
                    <span className="sm:hidden">{COPY.idleTouch[locale]}</span>
                  </>
                ) : (
                  COPY.previewOff[locale]
                )}
              </span>
            )}
          </div>
        </div>

        {/*
         * Ordered by how often it is used, not by when it was added.
         *
         * Reading, then the two things you do on your own turn, then the
         * record, then the settings you change between games, then the panel
         * you open once out of curiosity, then the meta line. The column had
         * drifted into arrival order, which put board configuration above
         * "replay that cascade" — a control that acts on the move just played.
         */}
        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-2">
          {/*
           * Driven by the animation frame rather than the settled state, so the
           * needle moves with the cascade instead of jumping to the answer
           * before the board has finished showing the working. Watching load
           * spike and then drop as an avalanche runs is the clearest statement
           * of the mechanic the app can make without words.
           */}
          <LoadGauge
            locale={locale}
            board={{ ...board, owners: view.owners, counts: view.counts }}
          />

          {/* Only while there is something to look back at, and never over the
              top of a cascade that is still running. */}
          {!animating && !finished ? (
            <CascadeReplay
              review={review}
              explosions={session.history.at(-1)?.explosions ?? 0}
              locale={locale}
            />
          ) : null}

          <Controls
            locale={locale}
            speed={speed}
            onSpeed={setSpeed}
            onUndo={session.undo}
            onReset={() => session.reset()}
            canUndo={session.record.moves.length > 0 && !animating}
            longestCascade={session.longestCascade}
            preview={previewOn}
            onPreview={(on) => {
              setPreviewOn(on)
              setPreviewEnabled(on)
              // Whatever was being considered is no longer being shown.
              setPreviewIndex(null)
              setAwaitingTap(null)
            }}
          />

          <MoveList locale={locale} moves={session.history} cols={board.cols} />

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

          {/*
           * Board size is a between-games decision, not a mid-game one, so it
           * folds away instead of competing with the controls that are used
           * every turn.
           */}
          <details className="border-t border-trace-hairline pt-3">
            <summary className="label-micro cursor-pointer select-none py-1">
              {COPY.boardSetup[locale]}
            </summary>
            <div className="pt-3">
              <Setup locale={locale} config={session.config} onApply={applyConfig} />
            </div>
          </details>

          {/*
           * Only in AI mode, and folded away. It answers "is this thing
           * actually searching, or is it just weighted toward corners" — a
           * question worth being able to answer and not one asked every turn.
           * Left open it would quietly coach, which is not what it is for.
           */}
          {mode === 'ai' ? (
            <details className="border-t border-trace-hairline pt-3">
              <summary className="label-micro cursor-pointer select-none py-1">
                {COPY.evaluation[locale]}
              </summary>
              <div className="pt-3">
                <EvaluationPanel state={session.state} locale={locale} />
              </div>
            </details>
          ) : null}

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

      {finished ? (
        <GameSummary
          locale={locale}
          record={session.record}
          stats={stats}
          review={
            reviewSubject === null ? null : (
              <PostMortemPanel
                review={postMortem.result}
                running={postMortem.running}
                error={postMortem.error}
                cols={board.cols}
                locale={locale}
                onRun={() => postMortem.run(session.record, reviewSubject)}
              />
            )
          }
        />
      ) : null}
    </main>
  )
}
