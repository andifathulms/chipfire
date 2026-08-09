'use client'

import { useEffect, useState } from 'react'
import { readSoundEnabled, setSoundEnabled, soundSupported } from '@/lib/sound'
import type { Locale } from '@/lib/i18n'

/**
 * Off until asked, and read from storage after mount rather than during render
 * — the page is statically exported, so the server has no idea what this
 * player prefers and rendering a guess would flash the wrong state.
 *
 * The control occupies its space from the first paint even though it cannot
 * work yet. Returning null until mounted meant the preview toggle beside it
 * appeared first and this one dropped in a frame later, pushing undo and
 * restart down under whichever finger or cursor was already on its way to them.
 */
const COPY = {
  label: { id: 'Suara', en: 'Sound' },
  on: { id: 'Nyala', en: 'On' },
  off: { id: 'Mati', en: 'Off' },
  hint: {
    id: 'Nada naik satu tingkat tiap tahap ledakan, jadi panjang rantai terdengar.',
    en: 'The pitch climbs a step per cascade generation, so chain depth is audible.',
  },
  unsupported: {
    id: 'Peramban ini tidak menyediakan audio.',
    en: 'This browser offers no audio.',
  },
} as const

/** Pending is the server's view and the first client frame: the control is
 *  drawn, sized and inert until we know what this browser can do. */
type Status = 'pending' | 'ready' | 'unsupported'

export function SoundToggle({ locale }: { locale: Locale }) {
  const [on, setOn] = useState(false)
  const [status, setStatus] = useState<Status>('pending')

  useEffect(() => {
    if (!soundSupported()) {
      setStatus('unsupported')
      return
    }
    setOn(readSoundEnabled())
    setStatus('ready')
  }, [])

  const usable = status === 'ready'

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-micro">{COPY.label[locale]}</span>
      <div className="grid grid-cols-2 border border-trace/30">
        {([false, true] as const).map((value) => (
          <button
            key={String(value)}
            type="button"
            disabled={!usable}
            onClick={() => {
              // The click itself is the gesture that lets the browser start
              // audio, so the setting is applied here rather than in an effect.
              setSoundEnabled(value)
              setOn(value)
            }}
            aria-pressed={usable ? on === value : undefined}
            className={[
              'px-2 py-1.5 text-xs transition-colors disabled:cursor-default',
              usable && on === value ? 'bg-trace text-chart' : 'hover:enabled:bg-chart-deep',
              usable ? '' : 'opacity-40',
            ].join(' ')}
          >
            {value ? COPY.on[locale] : COPY.off[locale]}
          </button>
        ))}
      </div>
      {status === 'unsupported' ? (
        <p className="text-xs text-trace-faint">{COPY.unsupported[locale]}</p>
      ) : null}
      {usable && on ? <p className="text-xs text-trace-faint">{COPY.hint[locale]}</p> : null}
    </div>
  )
}
