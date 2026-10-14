'use client'

import { useEffect, useState } from 'react'
import { readSoundEnabled, setSoundEnabled, soundSupported } from '@/lib/sound'
import type { Locale } from '@/lib/i18n'
import { Icon } from '@/components/ui/Icon'
import { BUTTON_ICON, BUTTON_ICON_ON } from '@/components/ui/styles'

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
  turnOn: { id: 'Nyalakan suara', en: 'Turn sound on' },
  turnOff: { id: 'Matikan suara', en: 'Turn sound off' },
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
  const label =
    status === 'unsupported'
      ? COPY.unsupported[locale]
      : on
        ? `${COPY.turnOff[locale]}. ${COPY.hint[locale]}`
        : COPY.turnOn[locale]

  /*
   * One icon button, pressed when sound is on. The hint that used to sit
   * under the old segmented control is the button's title now — the toolbar
   * has no room for a paragraph, and the pitch climbing is something you hear
   * rather than read about.
   */
  return (
    <button
      type="button"
      disabled={!usable}
      onClick={() => {
        // The click itself is the gesture that lets the browser start
        // audio, so the setting is applied here rather than in an effect.
        setSoundEnabled(!on)
        setOn(!on)
      }}
      aria-pressed={usable ? on : undefined}
      aria-label={label}
      title={label}
      className={usable && on ? BUTTON_ICON_ON : BUTTON_ICON}
    >
      <Icon name={usable && on ? 'sound' : 'sound-off'} />
    </button>
  )
}
