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
  /**
   * What kind of thing this is, before any mechanic is named. The tagline
   * below describes how the game works, which only helps a reader who already
   * knows they are looking at a game — "orb" and "massa kritis" read as
   * physics, not play, to someone who arrived cold.
   */
  lede: string
  tagline: string
  rulesTitle: string
  figureBefore: string
  figureAfter: string
  figureCaption: string
  moreWays: string
  play: string
  playHint: string
  replay: string
  replayHint: string
  versus: string
  versusHint: string
  footer: string
  back: string
  rules: readonly string[]
  learn: string
  learnHint: string
}

const DICTIONARY: Record<Locale, Copy> = {
  id: {
    lede: 'Permainan papan strategi bergiliran untuk 2–4 orang. Langsung main di browser, tanpa pasang apa pun.',
    tagline:
      'Taruh orb sampai sebuah sel penuh, lalu sel itu meledak ke tetangganya — dan setiap sel yang kena berpindah jadi milikmu. Satu langkah bisa membalik wilayah yang tidak kamu sentuh.',
    rulesTitle: 'Aturannya cuma tiga',
    figureBefore: 'Sebelum',
    figureAfter: 'Sesudah satu langkah',
    figureCaption:
      'Satu orb ditaruh di sel tengah milik Jingga. Lima ledakan beruntun, dan Biru tinggal satu sel.',
    moreWays: 'Cara lain',
    play: 'Main',
    playHint: 'Hotseat 2–4 pemain, atau lawan AI di satu perangkat.',
    replay: 'Ulang',
    replayHint: 'Muat kode permainan dan telusuri langkah demi langkah.',
    versus: 'Tanding',
    versusHint: 'Dua perangkat, sambungan langsung antar-browser.',
    footer: 'Statis, tanpa server. Sebuah permainan adalah daftar langkahnya.',
    back: 'Kembali',
    rules: [
      'Taruh satu orb di sel kosong atau sel milikmu.',
      'Sel penuh saat orbnya sebanyak tetangganya — 2 di sudut, 3 di tepi, 4 di tengah — lalu meledak ke semua tetangganya.',
      'Setiap sel yang kena jadi milikmu, dan bisa ikut meledak. Menang bila semua orb di papan milikmu.',
    ],
    learn: 'Belajar',
    learnHint: 'Lima langkah singkat sampai paham. Sekitar dua menit.',
  },
  en: {
    lede: 'A turn-based board game of strategy for 2–4 people. Plays in the browser, nothing to install.',
    tagline:
      'Add orbs until a cell is full, and it detonates into its neighbours — every cell the blast touches changes hands. One move can flip territory you never touched.',
    rulesTitle: 'There are only three rules',
    figureBefore: 'Before',
    figureAfter: 'After one move',
    figureCaption:
      'One orb goes into an orange cell in the middle. Five explosions later, blue is down to a single cell.',
    moreWays: 'Other ways to play',
    play: 'Play',
    playHint: 'Hotseat for 2–4 players, or take on the AI on one device.',
    replay: 'Replay',
    replayHint: 'Load a game code and step through it move by move.',
    versus: 'Versus',
    versusHint: 'Two devices, a direct browser-to-browser connection.',
    footer: 'Static, no server. A game is its move list.',
    back: 'Back',
    rules: [
      'Place one orb in an empty cell or one you already own.',
      'A cell is full when it holds as many orbs as it has neighbours — 2 in corners, 3 on edges, 4 in the middle — then it explodes into all of them.',
      'Every cell the blast reaches becomes yours, and may explode in turn. You win when every orb on the board is yours.',
    ],
    learn: 'Learn',
    learnHint: 'Five short steps until it clicks. About two minutes.',
  },
}

export function copy(locale: Locale): Copy {
  return DICTIONARY[locale]
}
