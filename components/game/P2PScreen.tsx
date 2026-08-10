'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Board } from '@/components/board/Board'
import { ConnectPanel } from '@/components/connect/ConnectPanel'
import { useCascadePlayer, type Speed } from '@/components/cascade/useCascadePlayer'
import { TurnIndicator } from '@/components/hud/TurnIndicator'
import { useP2PGame } from '@/components/game/useP2PGame'
import { DivergenceReport } from '@/components/hud/DivergenceReport'
import { MoveAnnouncer } from '@/components/hud/MoveAnnouncer'
import { previewMove, type MovePreview } from '@/lib/engine/preview'
import { recordResult } from '@/lib/stats'
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
  lastMove: { id: 'langkah terakhir', en: 'last move' },
  board: { id: 'Papan permainan', en: 'Game board' },
  empty: { id: 'kosong', en: 'empty' },
  owned: { id: 'milik', en: 'owned by' },
  mass: { id: 'massa kritis', en: 'critical mass' },
  preview: { id: 'Pratinjau ledakan', en: 'Cascade preview' },
  previewAsk: { id: 'Saya setuju', en: 'I agree' },
  previewWithdraw: { id: 'Batalkan', en: 'Withdraw' },
  previewOff: {
    id: 'Mati. Menyala hanya kalau kedua pemain setuju.',
    en: 'Off. It turns on only if both players agree.',
  },
  previewWaiting: {
    id: 'Kamu setuju. Menunggu lawan.',
    en: 'You agreed. Waiting for your opponent.',
  },
  previewOffered: {
    id: 'Lawan setuju. Kamu belum.',
    en: 'Your opponent agreed. You have not.',
  },
  previewOn: { id: 'Menyala — kedua pemain setuju.', en: 'On — both players agreed.' },
  reach: { id: 'Ledakan', en: 'Explosions' },
  captures: { id: 'Sel direbut', en: 'Cells taken' },
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

  /*
   * The preview finally exists here, and only by agreement (PRD §9.2). It was
   * absent from this screen entirely, which happened to satisfy "off by
   * default in P2P" by never offering it — the letter of the rule with none of
   * the point.
   */
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const preview: MovePreview | null =
    !game.previewAgreed || previewIndex === null || !myTurn || animating || finished
      ? null
      : previewMove(session.state, previewIndex)

  /*
   * P2P results were never recorded, so "win rate by mode" (PRD §9.5) had a
   * mode that could not be won and the avalanche distribution quietly meant
   * "games on this device except these". Same once-per-game guard as the local
   * screen: the move count identifies the game, so a re-render cannot
   * double-count it.
   */
  const recordedFor = useRef(-1)
  useEffect(() => {
    if (!finished) return
    const moveCount = session.record.moves.length
    if (recordedFor.current === moveCount) return
    recordedFor.current = moveCount
    recordResult(
      'p2p',
      session.state.winner === game.me,
      session.longestCascade,
      session.history.map((move) => move.explosions),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, session.record.moves.length, session.state.winner, game.me])

  const labelFor = (index: number) => {
    const row = Math.floor(index / session.state.board.cols) + 1
    const col = (index % session.state.board.cols) + 1
    const owner = view.owners[index]
    const mass = session.state.board.adjacency.criticalMass[index]
    const where = locale === 'id' ? `Baris ${row} kolom ${col}` : `Row ${row} column ${col}`

    // Across two devices the opponent's move is never witnessed, so where it
    // landed has to be readable after the fact — by eye and by screen reader.
    const played = session.record.moves.at(-1) === index ? `, ${COPY.lastMove[locale]}` : ''

    if (owner === NO_OWNER) {
      return `${where}, ${COPY.empty[locale]}, ${COPY.mass[locale]} ${mass}${played}`
    }
    return `${where}, ${COPY.owned[locale]} ${playerName(owner, locale)}, ${view.counts[index]} orb${played}`
  }

  return (
    <main className="mx-auto flex w-full flex-1 max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-trace-hairline pb-4">
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
          codeError={game.codeError}
          onHost={() => void game.host()}
          onRole={game.setRole}
          onJoin={(code) => void game.join(code)}
          onConfirm={(code) => void game.confirm(code)}
        />
      ) : null}

      {game.connected ? (
        <>
          <MoveAnnouncer
            state={session.state}
            history={session.history}
            cols={session.state.board.cols}
            locale={locale}
            settled={!animating}
          />

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

              {/* Adopting someone else's history is a decision, and it was
                  being asked with nothing but a move count to go on. */}
              {game.divergence !== null ? (
                <DivergenceReport
                  divergence={game.divergence}
                  cols={session.state.board.cols}
                  locale={locale}
                />
              ) : null}

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
              finished || myTurn ? 'border-trace bg-chart-deep' : 'border-trace-hairline text-trace-soft',
            ].join(' ')}
          >
            {finished
              ? `${playerName(session.state.winner ?? 0, locale)} ${COPY.wins[locale]}`
              : myTurn
                ? COPY.yourTurn[locale]
                : COPY.theirTurn[locale]}
          </p>

          {/* Same budget as the local screen, less the mode picker and rail:
              header, turn banner, board, preview panel, footer. See the note
              in PlayScreen for what the number accounts for and what it does
              not. Also unverified in a browser. */}
          <div
            className="mx-auto w-full [--chrome:30rem] sm:[--chrome:25rem]"
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
              converted={player.frame?.converted ?? []}
              frameKey={player.index}
              interactive={myTurn && !animating && !finished}
              onSelect={game.play}
              labelFor={labelFor}
              label={COPY.board[locale]}
              lastMove={session.record.moves.at(-1) ?? null}
              preview={preview}
              previewIndex={game.previewAgreed ? previewIndex : null}
              onPreview={game.previewAgreed ? setPreviewIndex : undefined}
            />
          </div>

          {/*
           * Two flags, stated as four sentences, because "waiting for them" and
           * "they are waiting for you" are different situations and a single
           * on/off control would show the same thing for both.
           */}
          <section className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-trace-hairline px-3 py-2 text-sm">
            <span className="label-micro">{COPY.preview[locale]}</span>
            <span aria-live="polite" className="text-trace-soft">
              {game.previewAgreed
                ? COPY.previewOn[locale]
                : game.previewMine
                  ? COPY.previewWaiting[locale]
                  : game.previewTheirs
                    ? COPY.previewOffered[locale]
                    : COPY.previewOff[locale]}
            </span>
            <button
              type="button"
              onClick={() => {
                game.setPreview(!game.previewMine)
                setPreviewIndex(null)
              }}
              className="ml-auto border border-trace-rule px-3 py-1 text-xs transition-colors hover:bg-chart-deep"
            >
              {game.previewMine ? COPY.previewWithdraw[locale] : COPY.previewAsk[locale]}
            </button>

            {/*
             * Always mounted once the preview is agreed, so hovering a cell
             * cannot resize the panel under the board. The same mistake was
             * made and fixed on the local screen: in an interface driven
             * entirely by pointing at cells, a readout that appears on hover
             * moves the page every time you look at anything.
             */}
            {game.previewAgreed ? (
              <span className="flex min-h-[1.75rem] w-full items-center gap-4 border-t border-trace-hairline pt-2">
                <span className="flex items-baseline gap-1">
                  <span className="label-micro">{COPY.reach[locale]}</span>
                  <span className="font-numeral">{preview?.explosions ?? '—'}</span>
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="label-micro">{COPY.captures[locale]}</span>
                  <span className="font-numeral">{preview?.capturedCount ?? '—'}</span>
                </span>
              </span>
            ) : null}
          </section>

          <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="font-numeral text-trace">{session.record.moves.length}</span>
            <span className="text-trace-soft">{COPY.moves[locale]}</span>
            <span className="break-all font-mono text-trace-faint">{session.hash}</span>
          </p>

          <button
            type="button"
            onClick={game.disconnect}
            className="self-start border border-trace-rule px-3 py-1 text-sm transition-colors hover:bg-chart-deep"
          >
            {COPY.disconnect[locale]}
          </button>
        </>
      ) : null}
    </main>
  )
}
