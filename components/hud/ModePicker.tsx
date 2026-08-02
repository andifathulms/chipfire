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
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex border border-trace/30">
        {modes.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onMode(option)}
            aria-pressed={mode === option}
            className={[
              'px-3 py-1 transition-colors',
              mode === option ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
            ].join(' ')}
          >
            {MODE_LABELS[option][locale]}
          </button>
        ))}
      </div>

      {mode === 'ai' ? (
        <label className="flex items-center gap-2">
          <span className="text-trace-soft">{COPY.difficulty[locale]}</span>
          <select
            value={difficulty}
            onChange={(event) => onDifficulty(event.target.value as Difficulty)}
            className="border border-trace/30 bg-chart px-2 py-1"
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {DIFFICULTY_LABELS[level][locale]}
              </option>
            ))}
          </select>
          <span className="max-w-xs text-xs text-trace-faint">{COPY.fair[locale]}</span>
        </label>
      ) : null}
    </div>
  )
}
