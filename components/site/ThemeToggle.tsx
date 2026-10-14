'use client'

import { useEffect, useState } from 'react'
import { readThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme'
import type { Locale } from '@/lib/i18n'
import { Icon, type IconName } from '@/components/ui/Icon'
import { BUTTON_ICON } from '@/components/ui/styles'

/**
 * One icon button in the top bar that steps through ikuti sistem → siang →
 * malam. It was a three-way segmented control in every footer, which spent a
 * full-width row on a setting changed about once.
 *
 * The label always says what the setting is now and what a press does, so the
 * cycle is never a guess.
 *
 * Read from storage after mount rather than during render, same reason as
 * `SoundToggle`: the page is statically exported, so the server has no idea
 * what this device prefers. The page's own colours never flash, though —
 * that's `THEME_INIT_SCRIPT` in app/chrome.tsx, which runs before this exists.
 */
const COPY = {
  label: { id: 'Tema', en: 'Theme' },
  system: { id: 'Ikuti sistem', en: 'Follow system' },
  light: { id: 'Siang', en: 'Day' },
  dark: { id: 'Malam', en: 'Night' },
  next: { id: 'ganti ke', en: 'switch to' },
} as const

const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark']

const ICONS: Record<ThemePreference, IconName> = {
  system: 'system',
  light: 'sun',
  dark: 'moon',
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => setPreference(readThemePreference()), [])

  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length] ?? 'system'
  const label = `${COPY.label[locale]}: ${COPY[preference][locale]} — ${COPY.next[locale]} ${COPY[
    next
  ][locale].toLowerCase()}`

  return (
    <button
      type="button"
      onClick={() => {
        setThemePreference(next)
        setPreference(next)
      }}
      aria-label={label}
      title={label}
      className={BUTTON_ICON}
    >
      <Icon name={ICONS[preference]} />
    </button>
  )
}
