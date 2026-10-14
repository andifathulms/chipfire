'use client'

import type { Difficulty } from '@/lib/ai/search'
import type { Locale } from '@/lib/i18n'
import { SEGMENT, SEGMENT_ON, SEGMENTED } from '@/components/ui/styles'

export type Mode = 'hotseat' | 'ai'

const MODE_LABELS: Record<Mode, Record<Locale, string>> = {
  hotseat: { id: 'Hotseat', en: 'Hotseat' },
  ai: { id: 'Lawan AI', en: 'Versus AI' },
}

const MODE_HINTS: Record<Mode, Record<Locale, string>> = {
  hotseat: { id: 'Gantian di satu perangkat', en: 'Take turns on one device' },
  ai: { id: 'Kamu lawan mesin', en: 'You against the machine' },
}

const DIFFICULTY_LABELS: Record<Difficulty, Record<Locale, string>> = {
  mudah: { id: 'Mudah', en: 'Easy' },
  sedang: { id: 'Sedang', en: 'Medium' },
  sulit: { id: 'Sulit', en: 'Hard' },
}

const COPY = {
  opponent: { id: 'Lawan', en: 'Opponent' },
  difficulty: { id: 'Tingkat', en: 'Level' },
  fair: {
    id: 'AI melihat papan yang sama denganmu. Tingkat hanya mengubah kedalaman pencarian.',
    en: 'The AI sees the same board you do. Level only changes how deep it searches.',
  },
} as const

/** The option cards' shared shape; the chosen one gets an ink ring. */
export const OPTION_CARD =
  'flex flex-col items-start gap-0.5 rounded-panel border bg-surface px-3 py-2.5 text-left transition-[border-color,box-shadow] hover:border-trace-rule'
export const OPTION_CARD_ON = 'border-trace ring-1 ring-trace'
export const OPTION_CARD_OFF = 'border-trace-hairline'

export function ModePicker({
  locale,
  mode,
  difficulty,
  onMode,
  onDifficulty,
}: {
  locale: Locale
  mode: Mode
  difficulty: Difficulty
  onMode: (mode: Mode) => void
  onDifficulty: (difficulty: Difficulty) => void
}) {
  const modes = Object.keys(MODE_LABELS) as Mode[]
  const levels = Object.keys(DIFFICULTY_LABELS) as Difficulty[]

  return (
    <div className="flex flex-col gap-3 text-sm">
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="label-micro mb-2 p-0">{COPY.opponent[locale]}</legend>
        {/* Two cards rather than two words: each says what the mode is, so the
            choice can be made without knowing the jargon. */}
        <div className="grid grid-cols-2 gap-2">
          {modes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onMode(option)}
              aria-pressed={mode === option}
              className={`${OPTION_CARD} ${mode === option ? OPTION_CARD_ON : OPTION_CARD_OFF}`}
            >
              <span className="font-display text-base font-bold [font-stretch:110%]">
                {MODE_LABELS[option][locale]}
              </span>
              <span className="text-xs text-trace-soft">{MODE_HINTS[option][locale]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'ai' ? (
        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="label-micro mb-2 p-0">{COPY.difficulty[locale]}</legend>
          {/* Three levels, so they are shown rather than hidden behind a select:
              a menu you must open to see your options is a menu you compare
              badly. */}
          <div className={`${SEGMENTED} w-full`}>
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onDifficulty(level)}
                aria-pressed={difficulty === level}
                className={`${SEGMENT} ${difficulty === level ? SEGMENT_ON : ''}`}
              >
                {DIFFICULTY_LABELS[level][locale]}
              </button>
            ))}
          </div>
          <p className="text-xs leading-snug text-trace-faint">{COPY.fair[locale]}</p>
        </fieldset>
      ) : null}
    </div>
  )
}
