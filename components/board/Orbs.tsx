import { styleFor, type OrbShape } from '@/lib/players'

/**
 * Orbs sit in fixed positions inside a cell, so a count is read at a glance
 * rather than counted. Shape carries ownership alongside colour — never colour
 * alone (PRD §12).
 */
const POSITIONS: readonly (readonly (readonly [number, number])[])[] = [
  [],
  [[50, 50]],
  [
    [33, 50],
    [67, 50],
  ],
  [
    [50, 31],
    [33, 66],
    [67, 66],
  ],
  [
    [33, 33],
    [67, 33],
    [33, 67],
    [67, 67],
  ],
  [
    [30, 30],
    [70, 30],
    [50, 50],
    [30, 70],
    [70, 70],
  ],
]

/*
 * Up to four orbs get the large radius; five share the centre with four
 * corners and would touch at it, so they step down.
 */
const RADIUS = 15
const RADIUS_CROWDED = 12

function Shape({ shape, x, y, r }: { shape: OrbShape; x: number; y: number; r: number }) {
  const RADIUS = r
  switch (shape) {
    case 'disc':
      return <circle cx={x} cy={y} r={RADIUS} fill="currentColor" />
    case 'ring':
      return (
        <circle
          cx={x}
          cy={y}
          r={RADIUS - 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
        />
      )
    case 'diamond':
      return (
        <polygon
          points={`${x},${y - RADIUS} ${x + RADIUS},${y} ${x},${y + RADIUS} ${x - RADIUS},${y}`}
          fill="currentColor"
        />
      )
    case 'triangle':
      return (
        <polygon
          points={`${x},${y - RADIUS} ${x + RADIUS},${y + RADIUS * 0.8} ${x - RADIUS},${y + RADIUS * 0.8}`}
          fill="currentColor"
        />
      )
    default: {
      const exhaustive: never = shape
      throw new Error(`unhandled orb shape: ${String(exhaustive)}`)
    }
  }
}

export function Orbs({ player, count }: { player: number; count: number }) {
  if (count <= 0) return null

  const style = styleFor(player)
  const positions = POSITIONS[count]

  return (
    <svg
      viewBox="0 0 100 100"
      className={`orb-glow h-full w-full overflow-visible ${style.text}`}
      aria-hidden="true"
    >
      {positions ? (
        positions.map((position, slot) => (
          <Shape
            key={slot}
            shape={style.shape}
            x={position[0]}
            y={position[1]}
            r={count >= 5 ? RADIUS_CROWDED : RADIUS}
          />
        ))
      ) : (
        // Beyond five, the cluster stops being legible; the numeral is clearer.
        <text
          x={50}
          y={50}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={46}
          fontWeight={800}
          fill="currentColor"
          className="font-numeral"
        >
          {count}
        </text>
      )}
    </svg>
  )
}
