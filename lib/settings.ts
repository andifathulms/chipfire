/**
 * Interface preferences that outlive a page load.
 *
 * Nothing here is game state. The engine imports none of it, none of it is
 * hashed or sent, and a game plays out identically whatever these say — which
 * is exactly why they can live in storage that might be full, disabled, or
 * cleared without anything needing to handle it beyond a default.
 */
const PREVIEW_KEY = 'chipfire.preview.v1'

/**
 * The cascade preview, for games on this device.
 *
 * On by default. PRD §9.2 calls it a teaching aid and a genuine strategic tool,
 * and a solo player has nobody to be unfair to — so the toggle exists to be
 * turned *off* by someone who finds it takes the surprise out of a cascade,
 * which is a real objection and not one the app should decide for them.
 *
 * Peer-to-peer deliberately does not use this. There the preference is
 * negotiated per session and starts off, because agreeing to it is something
 * the two players do together rather than something one of them brings.
 */
export function readPreviewEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    // Absent means never set, which is on. Only an explicit 'off' turns it off.
    return window.localStorage.getItem(PREVIEW_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setPreviewEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(PREVIEW_KEY, on ? 'on' : 'off')
  } catch {
    // Storage unavailable; the setting lasts as long as the page does.
  }
}
