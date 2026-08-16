/**
 * The night ground is a designed artefact, not an accessibility fallback —
 * DESIGN.md derives it from a physical claim (a detonation on an instrument is
 * light at night, not ink) and lifts every player hue until it clears text
 * contrast unaided there. Following the OS only means most people see exactly
 * one of the two schemes and never know the other exists.
 *
 * This preference is display-only. The engine imports none of it, none of it
 * is hashed or sent, and a game plays out identically whatever it says —
 * DESIGN-REWORK.md §6: never the move list, never the hash, never the wire.
 */
export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'chipfire.theme.v1'

/** `system` reads as "no explicit choice" — absent from storage, no
 *  `data-theme` attribute, `prefers-color-scheme` decides, same as today. */
export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Applies the attribute CSS keys off (globals.css) and persists the choice.
 * Both happen here, together, so a caller can never update one without the
 * other drifting out of sync until the next reload.
 */
export function setThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference)
    }
  } catch {
    // Storage unavailable; the choice lasts as long as the page does, and the
    // attribute below still applies it for the rest of this session.
  }

  if (preference === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', preference)
  }
}
