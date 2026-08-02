'use client'

import type { Locale } from '@/lib/i18n'
import type { Speed } from '@/components/cascade/useCascadePlayer'

const SPEED_LABELS: Record<Speed, Record<Locale, string>> = {
  pelan: { id: 'Pelan', en: 'Slow' },
  normal: { id: 'Normal', en: 'Normal' },
  cepat: { id: 'Cepat', en: 'Fast' },
  langsung: { id: 'Langsung', en: 'Instant' },
}

const COPY = {
  speed: { id: 'Kecepatan', en: 'Speed' },
  undo: { id: 'Batal langkah', en: 'Undo' },
  reset: { id: 'Ulang dari awal', en: 'Restart' },
  longest: { id: 'Rantai terpanjang', en: 'Longest chain' },
} as const

export function Controls({
  locale,
  speed,
  onSpeed,
  onUndo,
  onReset,
  canUndo,
  longestCascade,
}: {
  locale: Locale
  speed: Speed
  onSpeed: (speed: Speed) => void
  onUndo: () => void
  onReset: () => void
  canUndo: boolean
  longestCascade: number
}) {
  const speeds = Object.keys(SPEED_LABELS) as Speed[]

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-trace/20 pt-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-trace-soft">{COPY.speed[locale]}</span>
        <div className="flex border border-trace/30">
          {speeds.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSpeed(option)}
              aria-pressed={speed === option}
              className={[
                'px-2 py-1 text-xs transition-colors',
                speed === option ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
              ].join(' ')}
            >
              {SPEED_LABELS[option][locale]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-numeral text-xs text-trace-faint">
          {COPY.longest[locale]}: {longestCascade}
        </span>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="border border-trace/30 px-3 py-1 transition-colors hover:bg-chart-deep disabled:opacity-40"
        >
          {COPY.undo[locale]}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="border border-trace/30 px-3 py-1 transition-colors hover:bg-chart-deep"
        >
          {COPY.reset[locale]}
        </button>
      </div>
    </div>
  )
}
