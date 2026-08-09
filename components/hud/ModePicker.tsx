'use client'

import type { Difficulty } from '@/lib/ai/search'
import type { Locale } from '@/lib/i18n'

export type Mode = 'hotseat' | 'ai'

const MODE_LABELS: Record<Mode, Record<Locale, string>> = {
  hotseat: { id: 'Hotseat', en: 'Hotseat' },
  ai: { id: 'Lawan AI', en: 'Versus AI' },
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
      <fieldset className="flex flex-col gap-1.5 border-0 p-0">
        <legend className="label-micro mb-1.5 p-0">{COPY.opponent[locale]}</legend>
        <div className="grid grid-cols-2 border border-trace-rule">
          {modes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onMode(option)}
              aria-pressed={mode === option}
              className={[
                'px-3 py-1.5 transition-colors',
                mode === option ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
              ].join(' ')}
            >
              {MODE_LABELS[option][locale]}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'ai' ? (
        <fieldset className="flex flex-col gap-1.5 border-0 p-0">
          <legend className="label-micro mb-1.5 p-0">{COPY.difficulty[locale]}</legend>
          {/* Three levels, so they are shown rather than hidden behind a select:
              a menu you must open to see your options is a menu you compare
              badly. */}
          <div className="grid grid-cols-3 border border-trace-rule">
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onDifficulty(level)}
                aria-pressed={difficulty === level}
                className={[
                  'px-2 py-1.5 transition-colors',
                  difficulty === level ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
                ].join(' ')}
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
