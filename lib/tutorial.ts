import type { Notation } from './engine/notation'
import type { Locale } from './i18n'

/**
 * A scripted five-step lesson on hand-authored boards.
 *
 * Each step states what the move will do — how many explosions, how many cells
 * change hands, whether it wins. Those claims are asserted against the real
 * engine in tests/tutorial, so the lesson cannot drift away from the game it is
 * teaching.
 *
 * The boards are small and deliberately quiet: one idea per step, and the
 * opponent always keeps a cell out of reach so the lesson is not cut short by
 * an accidental victory.
 */
export type TutorialStep = {
  readonly id: string
  readonly position: Notation
  /** Cells the learner may play. Anything else is inert, not wrong. */
  readonly allowed: readonly number[]
  readonly title: Record<Locale, string>
  /** What to do, shown before the move. */
  readonly task: Record<Locale, string>
  /** What just happened, shown after it. */
  readonly result: Record<Locale, string>
  /** Asserted against the engine. */
  readonly expect: {
    readonly explosions: number
    readonly captures: number
    readonly wins: boolean
  }
}

export const TUTORIAL: readonly TutorialStep[] = [
  {
    id: 'place',
    position: {
      board: `
        .  .  .
        .  .  .
        .  .  B1
      `,
      current: 0,
    },
    allowed: [0, 1, 2, 3, 4, 5, 6, 7],
    title: { id: 'Menaruh orb', en: 'Placing an orb' },
    task: {
      id: 'Klik sel kosong mana pun. Orb itu jadi milikmu.',
      en: 'Click any empty cell. That orb becomes yours.',
    },
    result: {
      id: 'Sel itu sekarang milikmu. Belum ada yang meledak — batasnya belum tercapai.',
      en: 'That cell is yours now. Nothing exploded — the limit has not been reached.',
    },
    expect: { explosions: 0, captures: 0, wins: false },
  },
  {
    id: 'critical',
    position: {
      board: `
        A1 .  .
        .  .  .
        .  .  B1
      `,
      current: 0,
    },
    allowed: [0],
    title: { id: 'Batas dan ledakan', en: 'The limit, and the explosion' },
    task: {
      id: 'Sudut hanya menampung 2 orb, karena hanya punya 2 tetangga. Taruh satu lagi di sudut kiri atas.',
      en: 'A corner holds only 2 orbs, because it has only 2 neighbours. Place one more in the top-left corner.',
    },
    result: {
      id: 'Sel meledak: isinya berkurang 2, dan satu orb terlempar ke tiap tetangga. Sudut itu kini kosong.',
      en: 'The cell exploded: it lost 2 orbs, one to each neighbour. The corner is empty now.',
    },
    expect: { explosions: 1, captures: 0, wins: false },
  },
  {
    id: 'capture',
    position: {
      board: `
        A1 B1 .
        .  .  .
        .  .  B1
      `,
      current: 0,
    },
    allowed: [0],
    title: { id: 'Merebut sel lawan', en: 'Taking a cell' },
    task: {
      id: 'Sel biru ada tepat di sebelah sudutmu. Ledakkan sudut itu lagi.',
      en: 'A blue cell sits right beside your corner. Detonate that corner again.',
    },
    result: {
      id: 'Sel biru yang kena ledakan berpindah jadi milikmu — berapa pun orb yang tadinya ada di sana. Inilah inti permainannya.',
      en: 'The blue cell the blast reached became yours — however many orbs were sitting there. This is the whole game.',
    },
    expect: { explosions: 1, captures: 1, wins: false },
  },
  {
    id: 'chain',
    position: {
      board: `
        A1 A2 .
        A2 A3 .
        .  .  B1
      `,
      current: 0,
    },
    allowed: [0],
    title: { id: 'Reaksi berantai', en: 'The chain reaction' },
    task: {
      id: 'Sel-selmu hampir penuh semua. Taruh satu orb di sudut kiri atas dan perhatikan.',
      en: 'Your cells are nearly full. Place one orb in the top-left corner and watch.',
    },
    result: {
      id: 'Satu orb, lima ledakan. Ledakan mendorong tetangganya melewati batas, lalu tetangganya lagi. Ini yang membuat satu langkah bisa membalik papan.',
      en: 'One orb, five explosions. Each blast pushes neighbours past their own limit, and on it goes. This is how one move flips a board.',
    },
    expect: { explosions: 5, captures: 0, wins: false },
  },
  {
    id: 'win',
    position: {
      board: `
        A1 B1 .
        .  .  .
        .  .  .
      `,
      current: 0,
    },
    allowed: [0],
    title: { id: 'Menang', en: 'Winning' },
    task: {
      id: 'Biru tinggal punya satu sel, dan sel itu bersebelahan dengan sudutmu. Habisi.',
      en: 'Blue has one cell left, and it is next to your corner. Finish it.',
    },
    result: {
      id: 'Semua orb di papan jadi milikmu, jadi permainan selesai. Itu satu-satunya cara menang.',
      en: 'Every orb on the board is yours, so the game is over. That is the only way to win.',
    },
    expect: { explosions: 1, captures: 1, wins: true },
  },
]

export function stepAt(position: number): TutorialStep | undefined {
  return TUTORIAL[position]
}
