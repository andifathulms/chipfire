'use client'

import type { GameState } from '@/lib/engine/state'
import { playerName, styleFor } from '@/lib/players'
import type { Locale } from '@/lib/i18n'
import { Orbs } from '@/components/board/Orbs'

/**
 * Whose turn it is, and how much of the board each player holds. Shape and
 * label carry the identity alongside colour.
 */
export function TurnIndicator({
  state,
  locale,
  busy,
}: {
  state: GameState
  locale: Locale
  busy: boolean
}) {
  const players = Array.from({ length: state.players }, (_, player) => player)

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {players.map((player) => {
        const active = state.current === player && state.winner === null
        const out = state.eliminated[player] === 1
        const style = styleFor(player)

        return (
          <div
            key={player}
            className={[
              'flex min-w-[7.5rem] items-center gap-2 border px-3 py-2 transition-opacity',
              active ? 'border-trace bg-chart-deep' : 'border-trace/25',
              out ? 'opacity-40' : '',
            ].join(' ')}
          >
            <span className="h-6 w-6 shrink-0">
              <Orbs player={player} count={1} />
            </span>
            <span className="leading-tight">
              <span className={`block text-sm ${style.text}`}>{playerName(player, locale)}</span>
              <span className="block font-numeral text-xs text-trace-soft">
                {state.orbs[player]} orb
              </span>
            </span>
          </div>
        )
      })}

      {busy ? (
        <span className="self-center px-2 font-numeral text-xs uppercase tracking-widest text-trace-faint">
          {locale === 'id' ? 'merambat' : 'propagating'}
        </span>
      ) : null}
    </div>
  )
}
