'use client'

import type { Locale } from '@/lib/i18n'
import type { Speed } from '@/components/cascade/useCascadePlayer'
import { Icon } from '@/components/ui/Icon'
import {
  BUTTON,
  BUTTON_ICON,
  BUTTON_ICON_ON,
  SEGMENT,
  SEGMENT_ON,
  SEGMENTED,
} from '@/components/ui/styles'
import { SoundToggle } from './SoundToggle'

const SPEED_LABELS: Record<Speed, Record<Locale, string>> = {
  pelan: { id: 'Pelan', en: 'Slow' },
  normal: { id: 'Normal', en: 'Normal' },
  cepat: { id: 'Cepat', en: 'Fast' },
  langsung: { id: 'Langsung', en: 'Instant' },
}

const COPY = {
  speed: { id: 'Kecepatan', en: 'Speed' },
  previewOn: { id: 'Matikan pratinjau ledakan', en: 'Turn cascade preview off' },
  previewOff: { id: 'Nyalakan pratinjau ledakan', en: 'Turn cascade preview on' },
  undo: { id: 'Batal', en: 'Undo' },
  undoLong: { id: 'Batal langkah', en: 'Undo move' },
  reset: { id: 'Mulai ulang', en: 'Restart' },
  changeSetup: { id: 'Ubah papan', en: 'Change board' },
} as const

const SPEEDS = Object.keys(SPEED_LABELS) as Speed[]

/**
 * One toolbar row under the board.
 *
 * It used to be three full-width segmented rows and four buttons stacked in
 * the rail, which took more room than the game's own record. Grouped by how
 * often each is reached for: the move actions on the left, then how a cascade
 * is shown, then the two presentation switches as icons on the right. None of
 * the presentation controls changes a single thing the engine does.
 */
export function Controls({
  locale,
  speed,
  onSpeed,
  onUndo,
  onReset,
  canUndo,
  preview,
  onPreview,
  onChangeSetup,
}: {
  locale: Locale
  speed: Speed
  onSpeed: (speed: Speed) => void
  onUndo: () => void
  onReset: () => void
  canUndo: boolean
  preview: boolean
  onPreview: (on: boolean) => void
  /**
   * DESIGN-REWORK.md §3: unmounting Setup/ModePicker outside `siap` must not
   * mean the only way back to them is finishing the game — this is that way
   * back, reachable from Controls rather than requiring a restart.
   */
  onChangeSetup: () => void
}) {
  // On a phone the four speeds don't fit beside everything else, so the same
  // choice becomes one button that steps through them in order.
  const nextSpeed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 'normal'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label={COPY.undoLong[locale]}
        className={BUTTON}
      >
        <Icon name="undo" />
        <span className="hidden sm:inline">{COPY.undo[locale]}</span>
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label={COPY.reset[locale]}
        title={COPY.reset[locale]}
        className={BUTTON_ICON}
      >
        <Icon name="restart" />
      </button>
      <button
        type="button"
        onClick={onChangeSetup}
        aria-label={COPY.changeSetup[locale]}
        title={COPY.changeSetup[locale]}
        className={BUTTON_ICON}
      >
        <Icon name="board" />
      </button>

      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-trace-hairline sm:block" />

      <fieldset className="hidden border-0 p-0 sm:block">
        <legend className="sr-only">{COPY.speed[locale]}</legend>
        <div className={SEGMENTED}>
          {SPEEDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSpeed(option)}
              aria-pressed={speed === option}
              className={`${SEGMENT} ${speed === option ? SEGMENT_ON : ''}`}
            >
              {SPEED_LABELS[option][locale]}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => onSpeed(nextSpeed)}
        aria-label={`${COPY.speed[locale]}: ${SPEED_LABELS[speed][locale]}`}
        className={`${BUTTON} sm:hidden`}
      >
        <Icon name="speed" />
        <span>{SPEED_LABELS[speed][locale]}</span>
      </button>

      <span className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPreview(!preview)}
          aria-pressed={preview}
          aria-label={preview ? COPY.previewOn[locale] : COPY.previewOff[locale]}
          title={preview ? COPY.previewOn[locale] : COPY.previewOff[locale]}
          className={preview ? BUTTON_ICON_ON : BUTTON_ICON}
        >
          <Icon name={preview ? 'eye' : 'eye-off'} />
        </button>
        <SoundToggle locale={locale} />
      </span>
    </div>
  )
}
