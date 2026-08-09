'use client'

import { useEffect, useRef } from 'react'
import { cellName } from '@/lib/engine/notation'
import type { MoveSummary } from '@/lib/engine/replay'
import type { Locale } from '@/lib/i18n'
import { playerName, styleFor } from '@/lib/players'
import { Orbs } from '@/components/board/Orbs'

/**
 * The game as its move list, during the game.
 *
 * "A game is its move list" is this project's ontology — it is why undo is a
 * replay, why a shared code is short, and why two peers can agree without a
 * server. The replay viewer shows it, the export encodes it, and the one screen
 * that never showed it was the one where the game is actually being played. The
 * position on the board is not the game; it is what the list currently
 * evaluates to.
 *
 * Read-only on purpose. Clicking a line to jump back is what `ulang` is for,
 * and making the live board seekable would put a second, quieter kind of undo
 * in front of two players in a hotseat game.
 */
const COPY = {
  title: { id: 'Daftar langkah', en: 'Move list' },
  empty: { id: 'Belum ada langkah.', en: 'No moves yet.' },
  explosions: { id: 'ledakan', en: 'explosions' },
  captures: { id: 'sel direbut', en: 'cells taken' },
  /** The whole line, for a screen reader — the columns are visual. */
  line: {
    id: (turn: number, who: string, where: string, explosions: number, captures: number) =>
      explosions === 0
        ? `Langkah ${turn}, ${who}, ${where}, tanpa ledakan.`
        : `Langkah ${turn}, ${who}, ${where}, ${explosions} ledakan, ${captures} sel direbut.`,
    en: (turn: number, who: string, where: string, explosions: number, captures: number) =>
      explosions === 0
        ? `Move ${turn}, ${who}, ${where}, no explosions.`
        : `Move ${turn}, ${who}, ${where}, ${explosions} explosions, ${captures} cells taken.`,
  },
} as const

export function MoveList({
  moves,
  cols,
  locale,
}: {
  moves: readonly MoveSummary[]
  cols: number
  locale: Locale
}) {
  const endRef = useRef<HTMLLIElement | null>(null)

  /*
   * Play order, newest last, scrolled to the end. Reversing would keep the
   * recent move in view for free, but a move list that runs backwards stops
   * being a record of the game and becomes a feed.
   */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [moves.length])

  return (
    <section className="flex flex-col gap-xs">
      <h2 className="label-micro">{COPY.title[locale]}</h2>

      {moves.length === 0 ? (
        <p className="text-sm text-trace-faint">{COPY.empty[locale]}</p>
      ) : (
        <ol className="max-h-48 overflow-y-auto border-t border-trace-hairline text-sm">
          {moves.map((move, position) => {
            const turn = position + 1
            const where = cellName(cols, move.index)
            const style = styleFor(move.player)

            return (
              <li
                key={`${turn}:${move.index}`}
                ref={position === moves.length - 1 ? endRef : null}
                className="flex items-center gap-sm border-b border-trace-hairline py-1"
              >
                <span
                  className="font-numeral w-6 shrink-0 text-right text-xs text-trace-faint"
                  aria-hidden="true"
                >
                  {turn}
                </span>

                {/* Shape as well as colour, the same pairing the board uses —
                    ownership is state, so it is never colour alone (PRD §12). */}
                <span aria-hidden="true" className="h-3 w-3 shrink-0">
                  <Orbs player={move.player} count={1} />
                </span>

                <span className="font-mono shrink-0" aria-hidden="true">
                  {where}
                </span>

                {/*
                 * The cascade size is what turns a list of coordinates into the
                 * shape of the game: a run of blanks and then a 14 is the
                 * accumulate-and-release rhythm written down.
                 */}
                {move.explosions > 0 ? (
                  <span
                    className="font-numeral ml-auto shrink-0 text-xs text-trace-soft"
                    aria-hidden="true"
                  >
                    {move.explosions}× · {move.captures}
                  </span>
                ) : null}

                <span className="sr-only">
                  {COPY.line[locale](
                    turn,
                    playerName(move.player, locale),
                    where,
                    move.explosions,
                    move.captures,
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {/* The columns are unlabelled above; this says what they are once. */}
      {moves.length > 0 ? (
        <p aria-hidden="true" className="text-xs text-trace-faint">
          × {COPY.explosions[locale]} · {COPY.captures[locale]}
        </p>
      ) : null}
    </section>
  )
}
