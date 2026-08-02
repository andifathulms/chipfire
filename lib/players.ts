import type { Locale } from './i18n'

/**
 * Player identity is never colour alone (PRD §12). Ownership *is* the game
 * state, so it has to be readable without colour discrimination: each player
 * pairs a colour with a distinct orb shape.
 */
export type OrbShape = 'disc' | 'ring' | 'diamond' | 'triangle'

export type PlayerStyle = {
  readonly id: number
  readonly shape: OrbShape
  /** Semantic token, never a raw hex value in a component. */
  readonly fill: string
  readonly text: string
  readonly border: string
  readonly names: Record<Locale, string>
}

export const PLAYER_STYLES: readonly PlayerStyle[] = [
  {
    id: 0,
    shape: 'disc',
    fill: 'bg-p1',
    text: 'text-p1',
    border: 'border-p1',
    names: { id: 'Jingga', en: 'Orange' },
  },
  {
    id: 1,
    shape: 'ring',
    fill: 'bg-p2',
    text: 'text-p2',
    border: 'border-p2',
    names: { id: 'Biru', en: 'Blue' },
  },
  {
    id: 2,
    shape: 'diamond',
    fill: 'bg-p3',
    text: 'text-p3',
    border: 'border-p3',
    names: { id: 'Oker', en: 'Ochre' },
  },
  {
    id: 3,
    shape: 'triangle',
    fill: 'bg-p4',
    text: 'text-p4',
    border: 'border-p4',
    names: { id: 'Hijau', en: 'Green' },
  },
]

export function styleFor(player: number): PlayerStyle {
  const style = PLAYER_STYLES[player % PLAYER_STYLES.length]
  return style ?? PLAYER_STYLES[0]
}

export function playerName(player: number, locale: Locale): string {
  return styleFor(player).names[locale]
}
