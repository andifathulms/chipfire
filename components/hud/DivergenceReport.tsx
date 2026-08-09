import type { Divergence } from '@/lib/engine/diverge'
import { cellName } from '@/lib/engine/notation'
import type { Locale } from '@/lib/i18n'

/**
 * Where the two games stopped agreeing, in a sentence.
 *
 * The resync offer used to ask a player to adopt somebody else's entire history
 * on no information at all — the only thing on screen was how many moves long
 * it was. Halting on desync is correct and is not the same as explaining it,
 * and the difference between "a message went missing" and "one of these two
 * engines is wrong" is the difference between an inconvenience and the failure
 * this whole project is built to make impossible.
 *
 * Nothing here decides who is right. It reports what the two lists say.
 */
const COPY = {
  title: { id: 'Di mana keduanya berbeda', en: 'Where the two games differ' },

  identical: {
    id: 'Daftar langkah kedua sisi sama persis, dan tidak ada bukti yang membantahnya.',
    en: 'Both move lists are identical, and nothing contradicts them.',
  },

  moves: {
    id: (turn: number, mine: string, theirs: string) =>
      `Sampai langkah ${turn - 1} keduanya sama. Di langkah ${turn} kamu mencatat ${mine}, lawan mencatat ${theirs}.`,
    en: (turn: number, mine: string, theirs: string) =>
      `The two agree up to move ${turn - 1}. At move ${turn} yours says ${mine} and theirs says ${theirs}.`,
  },
  movesWhy: {
    id: 'Biasanya ada pesan yang hilang atau terkirim dua kali. Memutar ulang salah satu daftar akan menyelesaikannya.',
    en: 'Usually a message went missing or arrived twice. Replaying one of the lists will settle it.',
  },

  behindMine: {
    id: (shared: number) =>
      `Keduanya sama sampai langkah ${shared}. Daftar lawan lebih panjang — kamu tertinggal, bukan berbeda.`,
    en: (shared: number) =>
      `The two agree through move ${shared}. Theirs is longer — you are behind, not in disagreement.`,
  },
  behindTheirs: {
    id: (shared: number) =>
      `Keduanya sama sampai langkah ${shared}. Daftarmu lebih panjang — lawan tertinggal, bukan berbeda.`,
    en: (shared: number) =>
      `The two agree through move ${shared}. Yours is longer — they are behind, not in disagreement.`,
  },

  engine: {
    id: (turn: number) =>
      `Kedua daftar langkah sama persis, tapi hash di langkah ${turn} berbeda. Daftar langkah tidak bisa menjelaskan ini.`,
    en: (turn: number) =>
      `Both move lists are identical, yet the hash at move ${turn} differs. The move list cannot explain that.`,
  },
  engineWhy: {
    id: 'Artinya salah satu mesin menghitung hasil berbeda dari masukan yang sama — itu bug, bukan pesan yang hilang. Simpan kode permainan ini dan laporkan. Menyinkronkan ulang akan menghapus satu-satunya buktinya.',
    en: 'That means one of the two engines computed a different result from identical input — a bug, not a lost message. Save this game code and report it. Resyncing erases the only evidence there is.',
  },
} as const

export function DivergenceReport({
  divergence,
  cols,
  locale,
}: {
  divergence: Divergence
  cols: number
  locale: Locale
}) {
  /*
   * The engine case is the one that must not be quietly absorbed into the flow,
   * so it is the only one that raises its voice. Every other outcome here is
   * ordinary and reads as ordinary.
   */
  const alarming = divergence.kind === 'engine'

  const body = () => {
    switch (divergence.kind) {
      case 'identical':
        return <p>{COPY.identical[locale]}</p>
      case 'moves':
        return (
          <>
            <p>
              {COPY.moves[locale](
                divergence.turn,
                cellName(cols, divergence.mine),
                cellName(cols, divergence.theirs),
              )}
            </p>
            <p className="text-trace-soft">{COPY.movesWhy[locale]}</p>
          </>
        )
      case 'behind':
        return (
          <p>
            {divergence.shorter === 'mine'
              ? COPY.behindMine[locale](divergence.turn - 1)
              : COPY.behindTheirs[locale](divergence.turn - 1)}
          </p>
        )
      case 'engine':
        return (
          <>
            <p className="font-medium">{COPY.engine[locale](divergence.turn)}</p>
            <p>{COPY.engineWhy[locale]}</p>
          </>
        )
      default: {
        const exhaustive: never = divergence
        throw new Error(`unhandled divergence: ${JSON.stringify(exhaustive)}`)
      }
    }
  }

  return (
    <div
      className={[
        'flex flex-col gap-xs border-l-2 py-1 pl-sm text-sm',
        alarming ? 'border-p1 text-p1-ink' : 'border-trace/30',
      ].join(' ')}
    >
      <p className="label-micro">{COPY.title[locale]}</p>
      {body()}
    </div>
  )
}
