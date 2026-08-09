import { AVALANCHE_RANGES, type Stats } from '@/lib/stats'
import type { Locale } from '@/lib/i18n'

/**
 * The distribution of every avalanche you have ever set off.
 *
 * The PRD opens by naming Bak–Tang–Wiesenfeld and self-organised criticality,
 * and until now that framing was a citation in a document. This is the same
 * claim made out of the player's own games: avalanches are overwhelmingly
 * small, occasionally enormous, and there is no typical size in between.
 *
 * Every bar traces to games actually played on this device. Nothing is fitted,
 * smoothed, or extrapolated — the app has no number here it cannot point at a
 * rule and a record for.
 *
 * Built as a real table rather than a chart with a table beside it. The bars
 * are drawn inside the cells, so the accessible reading and the visual one are
 * the same object and cannot drift apart.
 */
const COPY = {
  title: { id: 'Sebaran ledakan beruntun', en: 'Avalanche sizes' },
  lede: {
    id: 'Dari semua permainan di perangkat ini. Sumbu mendatar berlipat dua tiap baris.',
    en: 'Across every game on this device. Each row spans twice the range of the one above.',
  },
  size: { id: 'Ukuran', en: 'Size' },
  count: { id: 'Jumlah', en: 'Count' },
  empty: {
    id: 'Belum ada ledakan beruntun yang tercatat. Selesaikan satu permainan.',
    en: 'No avalanches recorded yet. Finish a game.',
  },
  total: { id: 'ledakan beruntun tercatat', en: 'avalanches recorded' },
  cells: { id: 'sel meledak', en: 'cells detonated' },
} as const

function rangeLabel(low: number, high: number): string {
  if (high === 0) return `${low}+`
  return low === high ? `${low}` : `${low}–${high}`
}

export function AvalancheChart({ stats, locale }: { stats: Stats; locale: Locale }) {
  const counts = stats.avalanches
  const total = counts.reduce((sum, value) => sum + value, 0)
  // The longest bar sets the scale. A shared axis across sessions would make
  // an early game unreadable and tell the player nothing they cannot see here.
  const peak = Math.max(...counts, 1)

  return (
    <section className="flex flex-col gap-xs">
      <h3 className="label-micro">{COPY.title[locale]}</h3>

      {total === 0 ? (
        <p className="text-sm text-trace-faint">{COPY.empty[locale]}</p>
      ) : (
        <>
          <p className="max-w-measure text-xs text-trace-faint">{COPY.lede[locale]}</p>

          <table className="w-full max-w-md border-collapse text-sm">
            <caption className="sr-only">
              {COPY.title[locale]} — {total} {COPY.total[locale]}
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">{COPY.size[locale]}</th>
                <th scope="col">{COPY.count[locale]}</th>
              </tr>
            </thead>
            <tbody>
              {AVALANCHE_RANGES.map(([low, high], bucket) => {
                const count = counts[bucket] ?? 0
                const label = rangeLabel(low, high)

                return (
                  <tr key={label}>
                    {/* The axis. Tabular figures keep the ranges in a column
                        rather than a ragged edge. */}
                    <th
                      scope="row"
                      className="font-numeral w-14 py-[3px] pr-sm text-right align-middle text-xs font-normal text-trace-soft"
                    >
                      {label}
                    </th>

                    <td className="py-[3px] align-middle">
                      <div className="flex items-center gap-xs">
                        {/*
                         * Thin marks, anchored to the baseline at the left and
                         * rounded only at the data end, so the bar reads as a
                         * measurement running out from an axis rather than as
                         * a floating capsule.
                         */}
                        <div className="h-2 flex-1 bg-chart-deep">
                          <div
                            className="h-full rounded-r-[4px] bg-trace/80"
                            style={{ width: `${Math.round((count / peak) * 100)}%` }}
                          />
                        </div>
                        <span className="font-numeral w-8 shrink-0 text-right text-xs text-trace">
                          {count}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <p className="font-numeral text-xs text-trace-faint">
            {total} {COPY.total[locale]} · {stats.longestCascade} {COPY.cells[locale]}
          </p>
        </>
      )}
    </section>
  )
}
