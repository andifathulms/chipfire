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
      className="flex flex-wrap items-end gap-3 text-sm"
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
      {(
        [
          ['rows', config.rows, MIN_ROWS, MAX_ROWS],
          ['cols', config.cols, MIN_COLS, MAX_COLS],
          ['players', config.players, MIN_PLAYERS, MAX_PLAYERS],
        ] as const
      ).map(([name, value, min, max]) => (
        <label key={name} className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest text-trace-faint">
            {COPY[name][locale]}
          </span>
          <input
            type="number"
            name={name}
            defaultValue={value}
            min={min}
            max={max}
            className="w-20 border border-trace/30 bg-chart px-2 py-1 font-numeral"
          />
        </label>
      ))}

      <button
        type="submit"
        className="border border-trace px-3 py-1 transition-colors hover:bg-chart-deep"
      >
        {COPY.apply[locale]}
      </button>
    </form>
  )
}
