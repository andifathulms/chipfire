'use client'

import type { GameState } from '@/lib/engine/state'
import { playerName, styleFor } from '@/lib/players'
import type { Locale } from '@/lib/i18n'
import { Orbs } from '@/components/board/Orbs'

const COPY = {
  turn: { id: 'Giliran', en: 'Turn' },
  out: { id: 'Tersingkir', en: 'Out' },
  propagating: { id: 'Merambat', en: 'Propagating' },
  thinking: { id: 'Berpikir', en: 'Thinking' },
} as const

/**
 * Whose turn it is, and how much of the board each player holds. Shape and
 * label carry the identity alongside colour.
 *
 * The share bar exists because orb counts alone do not answer the question the
 * player is actually asking — am I ahead? — without arithmetic done mid-turn.
 * The bar answers it at a glance; the numeral keeps the exact value.
 *
 * It sits above the board at every width now, as a player bar: the board's
 * frame says whose turn it is in colour, and this says it in name and count.
 */
export function TurnIndicator({
  state,
  locale,
  busy,
  thinkingPlayer = null,
}: {
  state: GameState
  locale: Locale
  busy: boolean
  /**
   * The player currently deciding — the AI. Announced on their own card
   * rather than in a caption under the controls: this is the answer to "why
   * is nothing happening", so it belongs where the player is already looking.
   */
  thinkingPlayer?: number | null
}) {
  const players = Array.from({ length: state.players }, (_, player) => player)
  const total = players.reduce((sum, player) => sum + state.orbs[player], 0)

  /*
   * One chip per player, in a row above the board at every width. Two players
   * share the row; three or four wrap to two columns on a phone rather than
   * squeezing four names into 390px.
   */
  return (
    <div
      className={[
        'grid gap-2',
        state.players === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4',
      ].join(' ')}
    >
      {players.map((player) => {
        const active = state.current === player && state.winner === null
        const out = state.eliminated[player] === 1
        const style = styleFor(player)
        const orbs = state.orbs[player]
        // Integer percentage — no float reaches anything the player reads.
        const share = total === 0 ? 0 : Math.round((orbs * 100) / total)
        const tag = !active
          ? null
          : thinkingPlayer === player
            ? COPY.thinking[locale]
            : busy
              ? COPY.propagating[locale]
              : COPY.turn[locale]

        return (
          <div
            key={player}
            aria-current={active ? 'true' : undefined}
            className={[
              'flex min-w-0 flex-col gap-1.5 rounded-panel border bg-surface px-3 py-2 transition-[opacity,border-color,box-shadow] duration-200',
              // The player to move is lit in their own colour and everyone
              // else steps back. The tag says it in words as well, so the cue
              // survives a colour-blind read.
              active ? `${style.border} shadow-panel ring-1 ${style.ring}` : 'border-trace-hairline opacity-70',
              out ? 'opacity-40' : '',
            ].join(' ')}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-5 w-5 shrink-0">
                <Orbs player={player} count={1} />
              </span>
              <span className={`truncate text-sm font-semibold ${style.ink}`}>
                {playerName(player, locale)}
              </span>
              {tag !== null ? (
                <span
                  className={[
                    'label-micro hidden shrink-0 rounded-full px-1.5 py-0.5 sm:inline',
                    busy || thinkingPlayer === player ? 'animate-pulse' : '',
                  ].join(' ')}
                >
                  {tag}
                </span>
              ) : null}
              {out ? <span className="label-micro shrink-0">{COPY.out[locale]}</span> : null}
              <span className="ml-auto font-numeral text-xl font-bold leading-none">{orbs}</span>
            </div>

            {/* Share of every orb in play. Hidden from assistive tech: the
                count beside it is the same fact, stated precisely. */}
            <span aria-hidden="true" className="block h-1 w-full overflow-hidden rounded-full bg-chart-deep">
              <span
                className={`block h-full rounded-full ${style.fill} transition-[width] duration-300`}
                style={{ width: `${share}%` }}
              />
            </span>
          </div>
        )
      })}
    </div>
  )
}
