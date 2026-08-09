'use client'

import type { Locale } from '@/lib/i18n'
import type { Speed } from '@/components/cascade/useCascadePlayer'
import { SoundToggle } from './SoundToggle'

const SPEED_LABELS: Record<Speed, Record<Locale, string>> = {
  pelan: { id: 'Pelan', en: 'Slow' },
  normal: { id: 'Normal', en: 'Normal' },
  cepat: { id: 'Cepat', en: 'Fast' },
  langsung: { id: 'Langsung', en: 'Instant' },
}

const COPY = {
  speed: { id: 'Kecepatan', en: 'Speed' },
  preview: { id: 'Pratinjau ledakan', en: 'Cascade preview' },
  on: { id: 'Nyala', en: 'On' },
  off: { id: 'Mati', en: 'Off' },
  undo: { id: 'Batal langkah', en: 'Undo' },
  reset: { id: 'Mulai ulang', en: 'Restart' },
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
  preview,
  onPreview,
}: {
  locale: Locale
  speed: Speed
  onSpeed: (speed: Speed) => void
  onUndo: () => void
  onReset: () => void
  canUndo: boolean
  longestCascade: number
  preview: boolean
  onPreview: (on: boolean) => void
}) {
  const speeds = Object.keys(SPEED_LABELS) as Speed[]

  return (
    <div className="flex flex-col gap-3 border-t border-trace-hairline pt-4 text-sm">
      <fieldset className="flex flex-col gap-1.5 border-0 p-0">
        <legend className="label-micro mb-1.5 p-0">{COPY.speed[locale]}</legend>
        {/* A segmented control that fills the rail: equal columns, so the
            options read as one instrument rather than four loose buttons. */}
        <div className="grid grid-cols-4 border border-trace-rule">
          {speeds.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSpeed(option)}
              aria-pressed={speed === option}
              className={[
                'px-1 py-1.5 text-xs transition-colors',
                speed === option ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
              ].join(' ')}
            >
              {SPEED_LABELS[option][locale]}
            </button>
          ))}
        </div>
      </fieldset>

      {/*
       * Preview and sound sit with speed because all three are about how a
       * cascade is presented rather than about the game itself. None of them
       * changes a single thing the engine does.
       */}
      <fieldset className="flex flex-col gap-1.5 border-0 p-0">
        <legend className="label-micro mb-1.5 p-0">{COPY.preview[locale]}</legend>
        <div className="grid grid-cols-2 border border-trace-rule">
          {([true, false] as const).map((value) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => onPreview(value)}
              aria-pressed={preview === value}
              className={[
                'px-2 py-1.5 text-xs transition-colors',
                preview === value ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
              ].join(' ')}
            >
              {value ? COPY.on[locale] : COPY.off[locale]}
            </button>
          ))}
        </div>
      </fieldset>

      <SoundToggle locale={locale} />

      {/* Undo and restart are peers, so they get equal width. Both are large
          enough to be a comfortable touch target on a phone. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="border border-trace-rule px-3 py-1.5 transition-colors hover:bg-chart-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {COPY.undo[locale]}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="border border-trace-rule px-3 py-1.5 transition-colors hover:bg-chart-deep"
        >
          {COPY.reset[locale]}
        </button>
      </div>

      <p className="flex items-baseline justify-between gap-2">
        <span className="label-micro">{COPY.longest[locale]}</span>
        <span className="font-numeral text-base leading-none">{longestCascade}</span>
      </p>
    </div>
  )
}
