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
 * The layout is an auto-fitting grid rather than a row, so one component reads
 * correctly both as a wide strip above the board on a phone and as a stacked
 * rail beside it on a desktop.
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-micro">{COPY.turn[locale]}</span>
        {busy ? (
          <span aria-hidden="true" className="label-micro animate-pulse text-trace-soft">
            {COPY.propagating[locale]}
          </span>
        ) : null}
      </div>

      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))]">
        {players.map((player) => {
          const active = state.current === player && state.winner === null
          const out = state.eliminated[player] === 1
          const style = styleFor(player)
          const orbs = state.orbs[player]
          // Integer percentage — no float reaches anything the player reads.
          const share = total === 0 ? 0 : Math.round((orbs * 100) / total)

          return (
            <div
              key={player}
              aria-current={active ? 'true' : undefined}
              className={[
                'flex flex-col gap-2 border px-3 py-2 transition-colors',
                // The active player gets ink-weight border, a raised ground and
                // a rule down the left edge. Weight rather than hue, so the cue
                // survives a colour-blind read.
                active
                  ? 'border-trace bg-chart-deep shadow-[inset_2px_0_0_0] shadow-trace'
                  : 'border-trace-hairline',
                out ? 'opacity-50' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 shrink-0">
                  <Orbs player={player} count={1} />
                </span>
                <span className={`truncate text-sm font-medium ${style.ink}`}>
                  {playerName(player, locale)}
                </span>
                <span className="ml-auto font-numeral text-lg leading-none">{orbs}</span>
              </div>

              {/* Share of every orb in play. Hidden from assistive tech: the
                  count beside it is the same fact, stated precisely. */}
              <span aria-hidden="true" className="block h-[3px] w-full bg-trace-wash">
                <span
                  className={`block h-full ${style.fill} transition-[width] duration-300`}
                  style={{ width: `${share}%` }}
                />
              </span>

              {out ? <span className="label-micro">{COPY.out[locale]}</span> : null}
              {thinkingPlayer === player && !out ? (
                <span aria-hidden="true" className="label-micro animate-pulse text-trace-soft">
                  {COPY.thinking[locale]}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
