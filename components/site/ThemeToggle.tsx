'use client'

import { useEffect, useState } from 'react'
import { readThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme'
import type { Locale } from '@/lib/i18n'

/**
 * DESIGN-REWORK.md §6: a segmented control, per the signature — three
 * mutually-exclusive options in one shared border, the active one filled.
 *
 * Read from storage after mount rather than during render, same reason as
 * `SoundToggle`: the page is statically exported, so the server has no idea
 * what this device prefers, and guessing would show the wrong option
 * selected for a frame. The page's own colours never flash, though — that's
 * `THEME_INIT_SCRIPT` in app/chrome.tsx, which runs before this component
 * exists. Only the toggle's own selected state catches up a frame late.
 */
const COPY = {
  label: { id: 'Tema', en: 'Theme' },
  system: { id: 'Ikuti sistem', en: 'Follow system' },
  light: { id: 'Siang', en: 'Day' },
  dark: { id: 'Malam', en: 'Night' },
} as const

const OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark']

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => setPreference(readThemePreference()), [])

  return (
    <fieldset className="flex flex-col gap-1.5 border-0 p-0">
      <legend className="label-micro mb-1.5 p-0">{COPY.label[locale]}</legend>
      <div className="grid grid-cols-3 border border-trace-rule">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setThemePreference(option)
              setPreference(option)
            }}
            aria-pressed={preference === option}
            className={[
              'control-target px-2 py-1.5 text-xs transition-colors',
              preference === option ? 'bg-trace text-chart' : 'hover:bg-chart-deep',
            ].join(' ')}
          >
            {COPY[option][locale]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
