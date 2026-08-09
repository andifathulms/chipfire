'use client'

import { useEffect, useState } from 'react'
import { readSoundEnabled, setSoundEnabled, soundSupported } from '@/lib/sound'
import type { Locale } from '@/lib/i18n'

/**
 * Off until asked, and read from storage after mount rather than during render
 * — the page is statically exported, so the server has no idea what this
 * player prefers and guessing would flash the wrong state.
 */
const COPY = {
  label: { id: 'Suara', en: 'Sound' },
  on: { id: 'Nyala', en: 'On' },
  off: { id: 'Mati', en: 'Off' },
  hint: {
    id: 'Nada naik satu tingkat tiap tahap ledakan, jadi panjang rantai terdengar.',
    en: 'The pitch climbs a step per cascade generation, so chain depth is audible.',
  },
} as const

export function SoundToggle({ locale }: { locale: Locale }) {
  const [on, setOn] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setOn(readSoundEnabled())
    setReady(soundSupported())
  }, [])

  if (!ready) return null

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-micro">{COPY.label[locale]}</span>
      <div className="grid grid-cols-2 border border-trace/30">
        {([false, true] as const).map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => {
              // The click itself is the gesture that lets the browser start
              // audio, so the setting is applied here rather than in an effect.
              setSoundEnabled(value)
              setOn(value)
            }}
            aria-pressed={on === value}
            className={[
              'px-2 py-1.5 text-xs transition-colors',
              on === value ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
            ].join(' ')}
          >
            {value ? COPY.on[locale] : COPY.off[locale]}
          </button>
        ))}
      </div>
      {on ? <p className="text-xs text-trace-faint">{COPY.hint[locale]}</p> : null}
    </div>
  )
}
