'use client'

import {
  MAX_COLS,
  MAX_PLAYERS,
  MAX_ROWS,
  MIN_COLS,
  MIN_PLAYERS,
  MIN_ROWS,
} from '@/lib/engine/board'
import type { GameConfig } from '@/lib/engine/state'
import type { Locale } from '@/lib/i18n'

const COPY = {
  rows: { id: 'Baris', en: 'Rows' },
  cols: { id: 'Kolom', en: 'Columns' },
  players: { id: 'Pemain', en: 'Players' },
  apply: { id: 'Mulai papan baru', en: 'New board' },
  warning: {
    id: 'Papan baru mengakhiri permainan yang sedang berjalan.',
    en: 'A new board ends the game in progress.',
  },
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function Setup({
  locale,
  config,
  onApply,
}: {
  locale: Locale
  config: GameConfig
  onApply: (config: GameConfig) => void
}) {
  return (
    <form
      className="flex flex-col gap-3 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        onApply({
          rows: clamp(Number(data.get('rows')), MIN_ROWS, MAX_ROWS),
          cols: clamp(Number(data.get('cols')), MIN_COLS, MAX_COLS),
          players: clamp(Number(data.get('players')), MIN_PLAYERS, MAX_PLAYERS),
          seed: config.seed,
        })
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['rows', config.rows, MIN_ROWS, MAX_ROWS],
            ['cols', config.cols, MIN_COLS, MAX_COLS],
            ['players', config.players, MIN_PLAYERS, MAX_PLAYERS],
          ] as const
        ).map(([name, value, min, max]) => (
          <label key={name} className="flex flex-col gap-1">
            <span className="label-micro">{COPY[name][locale]}</span>
            <input
              type="number"
              name={name}
              defaultValue={value}
              min={min}
              max={max}
              className="w-full border border-trace-rule bg-chart px-2 py-1 font-numeral"
            />
          </label>
        ))}
      </div>

      {/* Stated plainly, because the button discards the game in progress and
          nothing else on the rail does. */}
      <p className="text-xs leading-snug text-trace-faint">{COPY.warning[locale]}</p>

      <button
        type="submit"
        className="border border-trace px-3 py-1.5 transition-colors hover:bg-chart-deep"
      >
        {COPY.apply[locale]}
      </button>
    </form>
  )
}
