import { identity, paths } from '@/lib/sandpile'
import { copy, type Locale } from '@/lib/i18n'

/**
 * The identity element of the abelian sandpile group, drawn.
 *
 * A server component with no client half, so this runs once during `next build`
 * and the finished shapes are baked into the HTML — about 190 ms at this size,
 * paid at build, never by a visitor. Nothing here reaches the browser as code.
 *
 * Not the hero. The landing page above the fold has one job, which is making a
 * stranger understand the game in five seconds, and this picture is beautiful
 * and completely mute about the rules. It sits after them, where a reader who
 * already knows what the game is can be told what it descends from.
 */

/**
 * Measured, not picked. Cost is the path data gzipped and counted twice, since
 * a server component's output lands in both the markup and the flight payload:
 *
 *   48 → 876 runs, ~4.7 kB   56 → 1,228 runs, ~6.5 kB   64 → 1,352 runs, ~7.3 kB
 *
 * 64 for the structure, which is what the picture is for; 96 doubles the weight
 * again for detail invisible at the size this is displayed. Build cost is
 * ~160 ms, paid once by `next build` and never by a visitor.
 */
const SIZE = 64

const FILL = ['fill-plate-1', 'fill-plate-2', 'fill-plate-3'] as const

export function SandpilePlate({ locale }: { locale: Locale }) {
  const t = copy(locale)
  const plate = identity(SIZE)
  const shapes = paths(plate)

  return (
    <figure className="flex flex-col gap-sm sm:flex-row sm:items-start sm:gap-lg">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={t.plateAlt}
        /* Once on the element rather than on every shape: at this density
           antialiased cell edges blur the picture into a grey haze. */
        shapeRendering="crispEdges"
        className="w-full max-w-[15rem] shrink-0 border border-trace-hairline bg-chart"
      >
        {shapes.map((d, level) => (
          <path key={level} d={d} className={FILL[level]} />
        ))}
      </svg>

      <figcaption className="flex max-w-measure flex-col gap-xs text-sm text-trace-soft">
        <span className="heading-panel">{t.plateTitle}</span>
        <span>{t.plateBody}</span>
        {/*
         * The caveat sits with the claim, not in a footnote. The appeal of this
         * ornament is that it is the mathematics rather than a picture of one,
         * and that is only worth anything if the difference between the
         * classical model and this board is stated where the claim is made.
         */}
        <span className="text-xs text-trace-faint">{t.plateCaveat}</span>
      </figcaption>
    </figure>
  )
}
