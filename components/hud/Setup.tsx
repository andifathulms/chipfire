'use client'

import { useEffect, useState } from 'react'
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
import { Orbs } from '@/components/board/Orbs'
import { BUTTON_PRIMARY } from '@/components/ui/styles'
import { OPTION_CARD, OPTION_CARD_OFF, OPTION_CARD_ON } from './ModePicker'

const COPY = {
  rows: { id: 'Baris', en: 'Rows' },
  cols: { id: 'Kolom', en: 'Columns' },
  players: { id: 'Pemain', en: 'Players' },
  board: { id: 'Papan', en: 'Board' },
  custom: { id: 'Atur sendiri', en: 'Custom size' },
  apply: { id: 'Mulai papan baru', en: 'Start a new board' },
  warning: {
    id: 'Papan baru mengakhiri permainan yang sedang berjalan.',
    en: 'A new board ends the game in progress.',
  },
} as const

/**
 * Named sizes, so the common choice is one tap rather than two number fields.
 * The middle one is the engine's default board.
 */
const PRESETS = [
  { key: 'kecil', label: { id: 'Kecil', en: 'Small' }, rows: 4, cols: 6 },
  { key: 'sedang', label: { id: 'Sedang', en: 'Medium' }, rows: 6, cols: 9 },
  { key: 'besar', label: { id: 'Besar', en: 'Large' }, rows: 8, cols: 12 },
] as const

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * The board configurator.
 *
 * `live` is the difference between the two places it appears. Before the first
 * move nothing is lost by changing the board, so every choice applies at once
 * and the empty board beside it is the preview. Over a game in progress
 * ("Ubah papan") applying would end that game, so choices are staged and only
 * a deliberate button commits them, with the consequence stated beside it.
 */
export function Setup({
  locale,
  config,
  onApply,
  live,
}: {
  locale: Locale
  config: GameConfig
  onApply: (config: GameConfig) => void
  live: boolean
}) {
  const [draft, setDraft] = useState({
    rows: config.rows,
    cols: config.cols,
    players: config.players,
  })

  // A fresh game from elsewhere (restart, mode switch) resets the draft to it.
  useEffect(() => {
    setDraft({ rows: config.rows, cols: config.cols, players: config.players })
  }, [config.rows, config.cols, config.players])

  const choose = (next: Partial<typeof draft>) => {
    const merged = {
      rows: clamp(next.rows ?? draft.rows, MIN_ROWS, MAX_ROWS),
      cols: clamp(next.cols ?? draft.cols, MIN_COLS, MAX_COLS),
      players: clamp(next.players ?? draft.players, MIN_PLAYERS, MAX_PLAYERS),
    }
    setDraft(merged)
    if (live) onApply({ ...merged, seed: config.seed })
  }

  const preset = PRESETS.find((p) => p.rows === draft.rows && p.cols === draft.cols)
  const playerCounts = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, offset) => MIN_PLAYERS + offset,
  )

  return (
    <form
      className="flex flex-col gap-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        onApply({ ...draft, seed: config.seed })
      }}
    >
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="label-micro mb-2 p-0">{COPY.players[locale]}</legend>
        {/* Each count shows the orb shapes it brings in, so the shapes are
            learned before the first move rather than discovered during it. */}
        <div className="grid grid-cols-3 gap-2">
          {playerCounts.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => choose({ players: count })}
              aria-pressed={draft.players === count}
              className={`${OPTION_CARD} !flex-row !items-center justify-center gap-2 px-2 ${
                draft.players === count ? OPTION_CARD_ON : OPTION_CARD_OFF
              }`}
            >
              <span className="font-numeral text-lg font-bold leading-none">{count}</span>
              <span aria-hidden="true" className="flex gap-0.5">
                {Array.from({ length: count }, (_, player) => (
                  <span key={player} className="h-4 w-4">
                    <Orbs player={player} count={1} />
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="label-micro mb-2 p-0">{COPY.board[locale]}</legend>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => choose({ rows: option.rows, cols: option.cols })}
              aria-pressed={preset?.key === option.key}
              className={`${OPTION_CARD} gap-2 ${
                preset?.key === option.key ? OPTION_CARD_ON : OPTION_CARD_OFF
              }`}
            >
              {/* The size drawn to scale, a dot per cell. */}
              <span
                aria-hidden="true"
                className="grid gap-[1.5px]"
                style={{ gridTemplateColumns: `repeat(${option.cols}, 4px)` }}
              >
                {Array.from({ length: option.rows * option.cols }, (_, cell) => (
                  <span key={cell} className="h-1 w-1 rounded-[1px] bg-trace-rule" />
                ))}
              </span>
              <span className="font-display text-sm font-bold">{option.label[locale]}</span>
              <span className="font-numeral text-xs text-trace-soft">
                {option.cols}×{option.rows}
              </span>
            </button>
          ))}
        </div>

        <details className="group" open={preset === undefined}>
          <summary className="cursor-pointer select-none py-1 text-xs text-trace-soft hover:text-trace">
            {COPY.custom[locale]}
          </summary>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {(
              [
                ['cols', draft.cols, MIN_COLS, MAX_COLS],
                ['rows', draft.rows, MIN_ROWS, MAX_ROWS],
              ] as const
            ).map(([name, value, min, max]) => (
              <label key={name} className="flex flex-col gap-1">
                <span className="label-micro">{COPY[name][locale]}</span>
                {/*
                 * Committed on blur (or Enter), not per keystroke: clamping
                 * while typing would turn the "1" of "12" into the minimum
                 * before the "2" arrived. Keyed on the value so a preset tap
                 * rewrites what the field shows.
                 */}
                <input
                  key={`${name}-${value}`}
                  type="number"
                  name={name}
                  defaultValue={value}
                  min={min}
                  max={max}
                  onBlur={(event) => {
                    const next = Number(event.currentTarget.value)
                    if (next !== value) choose({ [name]: next })
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    event.currentTarget.blur()
                  }}
                  className="control-target w-full rounded-ctl border border-trace-rule bg-surface px-3 py-1 font-numeral"
                />
              </label>
            ))}
          </div>
        </details>
      </fieldset>

      {live ? null : (
        <>
          {/* Stated plainly, because the button discards the game in progress
              and nothing else on the screen does. */}
          <p className="text-xs leading-snug text-trace-faint">{COPY.warning[locale]}</p>
          <button type="submit" className={BUTTON_PRIMARY}>
            {COPY.apply[locale]}
          </button>
        </>
      )}
    </form>
  )
}
