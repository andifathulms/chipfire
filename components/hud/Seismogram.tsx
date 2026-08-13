import { Orbs } from '@/components/board/Orbs'
import type { MoveSummary } from '@/lib/engine/replay'
import { AVALANCHE_BUCKETS, avalancheBucket } from '@/lib/stats'
import type { Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

/**
 * The game's own seismic record, drawn as it is played.
 *
 * PRD §12 puts this app in a monitoring station — chart paper, hairline grid,
 * ink, everything instrumented rather than arcade — and then gives it nothing
 * to write. The paper has been blank since M2. This is the trace: one tick per
 * move, drawn on the paper that was always there.
 *
 * ── Why a log scale, and why this one ─────────────────────────────────────
 *
 * Tick height is the avalanche bucket, the same doubling classification the
 * end-of-game distribution uses: 1, 2, 3–4, 5–8, and so on. Three things fall
 * out of that, and all three matter more than they look.
 *
 * The scale never changes. A linear axis would have to rescale the moment a
 * bigger cascade arrived, so every earlier tick would move — a chart that
 * rewrites its own history as you read it.
 *
 * It is the right scale for the subject. Avalanche sizes in this model are
 * heavy-tailed; on a linear axis a single 40-cell chain flattens fifty real
 * events into the baseline. Magnitude scales for actual seismographs are
 * logarithmic for exactly this reason.
 *
 * And it is the classification the app already uses, so the strip and the
 * distribution at the end of the game cannot disagree about how big something
 * was.
 *
 * ── Whose move, without relying on colour ─────────────────────────────────
 *
 * One lane per player, stacked, sharing an x-axis — a multi-channel station
 * chart. Position carries the identity and colour only reinforces it, which is
 * invariant 16: ownership must survive a reader who cannot separate the hues.
 * Each lane is labelled with that player's orb, shape and all.
 */
const COPY = {
  title: { id: 'Rekaman ledakan', en: 'Cascade record' },
  scale: {
    id: `Tinggi tiap garis mengikuti kelipatan dua — 1, 2, 3–4, 5–8, dan seterusnya — sama seperti sebaran di akhir permainan. Garis rata berarti langkah itu tidak memicu apa-apa.`,
    en: `Tick height follows doubling ranges — 1, 2, 3–4, 5–8, and so on — the same classification as the distribution at the end of a game. A flat mark means that move set nothing off.`,
  },
  empty: { id: 'Belum ada langkah.', en: 'No moves yet.' },
  lane: {
    id: (who: string) => `Rekaman ${who}`,
    en: (who: string) => `${who}’s record`,
  },
  /** The whole strip, read out. The ticks themselves are shapes. */
  described: {
    id: (who: string, moves: number, biggest: number) =>
      `${who}: ${moves} langkah, ledakan terpanjang ${biggest} sel.`,
    en: (who: string, moves: number, biggest: number) =>
      `${who}: ${moves} moves, longest cascade ${biggest} cells.`,
  },
} as const

/** Levels 0…9, so the tallest bucket and the baseline both have room. */
const VIEW_HEIGHT = 9

/** A move that set nothing off still happened, and the record says so — a mark
 *  on the baseline rather than a gap, which would read as a missing turn. */
const QUIET = 0.7

function levelFor(explosions: number): number {
  const bucket = avalancheBucket(explosions)
  if (bucket < 0) return QUIET
  // bucket 0 (a single explosion) starts at 2, so the smallest real avalanche
  // is unmistakably taller than a quiet move rather than a shade above it.
  return Math.min(VIEW_HEIGHT, bucket + 2)
}

export function Seismogram({
  moves,
  players,
  locale,
}: {
  moves: readonly MoveSummary[]
  players: number
  locale: Locale
}) {
  /*
   * A minimum width in ticks so a two-move game does not draw two enormous
   * bars. The strip fills its column either way; this only fixes what one tick
   * is worth.
   */
  const span = Math.max(moves.length, 24)
  const lanes = Array.from({ length: players }, (_, player) => player)

  return (
    <section className="flex flex-col gap-xs">
      <h2 className="heading-panel">{COPY.title[locale]}</h2>

      {moves.length === 0 ? (
        <p className="text-sm text-trace-faint">{COPY.empty[locale]}</p>
      ) : (
        <>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-xs gap-y-2xs">
            {lanes.map((player) => {
              const own = moves.filter((move) => move.player === player)
              const biggest = own.reduce((top, move) => Math.max(top, move.explosions), 0)

              return (
                <div key={player} className="contents">
                  {/* Shape and colour, the same pairing the board uses. */}
                  <span aria-hidden="true" className="h-3 w-3">
                    <Orbs player={player} count={1} />
                  </span>

                  <svg
                    viewBox={`0 0 ${span} ${VIEW_HEIGHT}`}
                    /*
                     * Non-uniform, which is safe here only because every mark
                     * is a filled rect — a stroked baseline would smear into a
                     * wedge as the column widened.
                     */
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={COPY.described[locale](
                      playerName(player, locale),
                      own.length,
                      biggest,
                    )}
                    className="h-7 w-full bg-chart-deep/50"
                  >
                    {/* The paper's own baseline, under the ticks. */}
                    <rect
                      x={0}
                      y={VIEW_HEIGHT - 0.25}
                      width={span}
                      height={0.25}
                      className="fill-trace-hairline"
                    />
                    {moves.map((move, position) =>
                      move.player === player ? (
                        <rect
                          key={position}
                          x={position + 0.15}
                          width={0.7}
                          y={VIEW_HEIGHT - levelFor(move.explosions)}
                          height={levelFor(move.explosions)}
                          className={PLAYER_FILL[player % PLAYER_FILL.length]}
                        />
                      ) : null,
                    )}
                  </svg>
                </div>
              )
            })}
          </div>

          {/* The scale, stated where it is read — a log axis that does not say
              so is a chart that flatters its own smallest events. */}
          <p className="max-w-measure text-xs text-trace-faint">{COPY.scale[locale]}</p>
        </>
      )}
    </section>
  )
}

/**
 * SVG fills rather than the `bg-*` classes in lib/players: `fill` and
 * `background-color` are different properties and Tailwind generates them from
 * different utilities. Same four tokens either way.
 */
const PLAYER_FILL = ['fill-p1', 'fill-p2', 'fill-p3', 'fill-p4'] as const

/** Exported for the test that pins the scale to the distribution's buckets. */
export const SEISMOGRAM = { levelFor, VIEW_HEIGHT, QUIET, BUCKETS: AVALANCHE_BUCKETS }
