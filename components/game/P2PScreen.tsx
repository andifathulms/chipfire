'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { ConnectPanel } from '@/components/connect/ConnectPanel'
import { useCascadePlayer, type Speed } from '@/components/cascade/useCascadePlayer'
import { TurnIndicator } from '@/components/hud/TurnIndicator'
import { useP2PGame } from '@/components/game/useP2PGame'
import { NO_OWNER } from '@/lib/engine/board'
import { copy, type Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

const COPY = {
  yourTurn: { id: 'Giliranmu', en: 'Your turn' },
  theirTurn: { id: 'Giliran lawan', en: 'Opponent’s turn' },
  wins: { id: 'menang', en: 'wins' },
  desyncTitle: { id: 'Permainan tidak lagi sinkron', en: 'The games have diverged' },
  desyncBody: {
    id: 'Kedua sisi berhenti di sini. Tidak ada yang dianggap benar secara otomatis. Salah satu bisa menawarkan daftar langkahnya untuk diputar ulang.',
    en: 'Both sides stop here. Neither is assumed correct. One of you can offer their move list to be replayed.',
  },
  offerList: { id: 'Tawarkan daftar langkahku', en: 'Offer my move list' },
  incoming: { id: 'Lawan menawarkan daftar langkah', en: 'Your opponent offered a move list' },
  accept: { id: 'Terima dan putar ulang', en: 'Accept and replay' },
  disconnect: { id: 'Putuskan', en: 'Disconnect' },
  moves: { id: 'langkah', en: 'moves' },
  board: { id: 'Papan permainan', en: 'Game board' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
  mass: { id: 'massa kritis', en: 'critical mass' },
} as const

export function P2PScreen({ locale }: { locale: Locale }) {
  const [speed] = useState<Speed>('normal')
  const game = useP2PGame()
  const session = game.session
  const frames = session.pending?.frames ?? []
  const player = useCascadePlayer(frames, speed, session.settle)

  const view = player.frame ?? session.state.board
  const animating = session.pending !== null
  const finished = session.state.winner !== null && !animating
  const myTurn = game.connected && session.state.current === game.me && game.desync === null

  const labelFor = (index: number) => {
    const row = Math.floor(index / session.state.board.cols) + 1
    const col = (index % session.state.board.cols) + 1
    const owner = view.owners[index]
    const mass = session.state.board.adjacency.criticalMass[index]
    const where = locale === 'id' ? `Baris ${row} kolom ${col}` : `Row ${row} column ${col}`

    if (owner === NO_OWNER) return `${where}, ${COPY.empty[locale]}, ${COPY.mass[locale]} ${mass}`
    return `${where}, ${COPY.owned[locale]} ${playerName(owner, locale)}, ${view.counts[index]} orb`
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-trace/20 pb-4">
        <h1 className="font-numeral text-3xl">Tanding</h1>
        <Link href={`/${locale}/`} className="text-sm underline">
          {copy(locale).back}
        </Link>
      </header>

      {!game.connected ? (
        <ConnectPanel
          locale={locale}
          role={game.role}
          status={game.status}
          offerCode={game.offerCode}
          answerCode={game.answerCode}
          error={game.error}
          onHost={() => void game.host()}
          onRole={game.setRole}
          onJoin={(code) => void game.join(code)}
          onConfirm={(code) => void game.confirm(code)}
        />
      ) : null}

      {game.connected ? (
        <>
          <TurnIndicator state={session.state} locale={locale} busy={animating} />

          {/*
           * Desync halts the game, so it is reported above the board rather
           * than below it. Below, on a board tall enough to fill the viewport,
           * the one message that explains why nothing responds is off-screen.
           */}
          {game.desync !== null ? (
            <section
              role="alert"
              className="flex flex-col gap-3 border-l-2 border-p1 bg-chart-deep p-4 text-sm"
            >
              <p className="font-numeral text-base text-p1-ink">{COPY.desyncTitle[locale]}</p>
              <p className="max-w-prose text-trace-soft">{COPY.desyncBody[locale]}</p>
              <p className="break-all font-mono text-xs">
                {game.desync.expected} ≠ {game.desync.received}
              </p>
              <button
                type="button"
                onClick={game.offerResync}
                className="self-start border border-trace bg-trace px-3 py-1.5 text-chart transition-opacity hover:opacity-85"
              >
                {COPY.offerList[locale]}
              </button>
            </section>
          ) : null}

          {game.offeredMoves !== null ? (
            <section className="flex flex-col gap-2 border border-trace p-4 text-sm">
              <p>
                {COPY.incoming[locale]} — {game.offeredMoves.length} {COPY.moves[locale]}
              </p>
              <button
                type="button"
                onClick={game.acceptResync}
                className="self-start border border-trace bg-trace px-3 py-1.5 text-chart transition-opacity hover:opacity-85"
              >
                {COPY.accept[locale]}
              </button>
            </section>
          ) : null}

          {/*
           * Across two devices there is nobody sitting beside you to make the
           * turn obvious, so it is stated at full size rather than in a caption.
           */}
          <p
            aria-live="polite"
            className={[
              'border px-3 py-2 font-numeral text-base',
              finished || myTurn ? 'border-trace bg-chart-deep' : 'border-trace/25 text-trace-soft',
            ].join(' ')}
          >
            {finished
              ? `${playerName(session.state.winner ?? 0, locale)} ${COPY.wins[locale]}`
              : myTurn
                ? COPY.yourTurn[locale]
                : COPY.theirTurn[locale]}
          </p>

          <div
            className="mx-auto w-full [--chrome:24rem] sm:[--chrome:21rem]"
            style={{
              maxWidth: `max(15rem, calc((100dvh - var(--chrome)) * ${
                session.state.board.cols / session.state.board.rows
              }))`,
            }}
          >
            <Board
              board={session.state.board}
              view={view}
              legal={session.legal}
              exploding={player.frame?.exploding ?? []}
              interactive={myTurn && !animating && !finished}
              onSelect={game.play}
              labelFor={labelFor}
              label={COPY.board[locale]}
            />
          </div>

          <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="font-numeral text-trace">{session.record.moves.length}</span>
            <span className="text-trace-soft">{COPY.moves[locale]}</span>
            <span className="break-all font-mono text-trace-faint">{session.hash}</span>
          </p>

          <button
            type="button"
            onClick={game.disconnect}
            className="self-start border border-trace/30 px-3 py-1 text-sm transition-colors hover:bg-chart-deep"
          >
            {COPY.disconnect[locale]}
          </button>
        </>
      ) : null}
    </main>
  )
}
