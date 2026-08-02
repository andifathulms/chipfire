/**
 * Indonesian first, English secondary. Copy stays plain and short (PRD §12).
 * Static export means locales are known at build time, not negotiated.
 */
export const LOCALES = ['id', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

type Copy = {
  tagline: string
  play: string
  playHint: string
  replay: string
  replayHint: string
  versus: string
  versusHint: string
  footer: string
  back: string
}

const DICTIONARY: Record<Locale, Copy> = {
  id: {
    tagline:
      'Taruh orb, capai massa kritis, dan biarkan ledakannya merambat. Satu langkah bisa membalik wilayah yang tidak kamu sentuh.',
    play: 'Main',
    playHint: 'Hotseat 2–4 pemain, atau lawan AI di satu perangkat.',
    replay: 'Ulang',
    replayHint: 'Muat kode permainan dan telusuri langkah demi langkah.',
    versus: 'Tanding',
    versusHint: 'Dua perangkat, sambungan langsung antar-browser.',
    footer: 'Statis, tanpa server. Sebuah permainan adalah daftar langkahnya.',
    back: 'Kembali',
  },
  en: {
    tagline:
      'Place an orb, reach critical mass, and let the blast propagate. One move can flip territory you never touched.',
    play: 'Play',
    playHint: 'Hotseat for 2–4 players, or take on the AI on one device.',
    replay: 'Replay',
    replayHint: 'Load a game code and step through it move by move.',
    versus: 'Versus',
    versusHint: 'Two devices, a direct browser-to-browser connection.',
    footer: 'Static, no server. A game is its move list.',
    back: 'Back',
  },
}

export function copy(locale: Locale): Copy {
  return DICTIONARY[locale]
}
