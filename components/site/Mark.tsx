/**
 * The Chipfire mark — "Propagation": a rust core with four orbs on the
 * orthogonal axes. It is the game's own rule drawn once: a cell at critical
 * mass shedding one orb to each neighbour, which is `applyMove` exactly.
 *
 * Inlined as SVG rather than served as a file. It is 300 bytes, it inherits
 * the surrounding ink through `currentColor` the way the brand master intends,
 * and an <img> here would be a network request for something smaller than its
 * own request header.
 *
 * The tiled, ink-backed form of this mark is what ships as the favicon and the
 * app icons — see public/favicon.svg. On chart paper the tile is redundant, so
 * the glyph stands alone.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
      className={className}
      /* Outer orbs take the parent's ink; the core never moves off rust. */
      fill="currentColor"
    >
      <circle cx="256" cy="256" r="66.6" className="fill-mark" />
      <circle cx="256" cy="94.7" r="33.3" />
      <circle cx="256" cy="417.3" r="33.3" />
      <circle cx="94.7" cy="256" r="33.3" />
      <circle cx="417.3" cy="256" r="33.3" />
    </svg>
  )
}

/**
 * Mark plus name, as one unit.
 *
 * Clear space is a brand rule — one outer-orb diameter, 13% of the tile — and
 * `gap` is how it survives a future edit, since a hardcoded margin drifts the
 * moment the size changes.
 */
export function Wordmark({
  size = 'sm',
  className,
  nameClassName,
}: {
  size?: 'sm' | 'lg'
  className?: string
  /*
   * Decoration on the name only. Inside a link, `underline` on the wrapper
   * draws a rule under the mark as well, which turns a logo into struck-out
   * artwork.
   */
  nameClassName?: string
}) {
  const large = size === 'lg'

  return (
    <span className={`inline-flex items-center ${large ? 'gap-3' : 'gap-1.5'} ${className ?? ''}`}>
      {/* Small sizes in em, so the mark tracks whatever type it sits beside —
          a 14px crumb and a 24px fallback link both get a mark in proportion,
          without either caller having to say so. */}
      <Mark className={large ? 'h-9 w-9 sm:h-11 sm:w-11' : 'h-[0.85em] w-[0.85em]'} />
      <span
        className={`${large ? 'font-numeral text-6xl leading-none tracking-tight sm:text-7xl' : ''} ${nameClassName ?? ''}`}
      >
        Chipfire
      </span>
    </span>
  )
}
