/**
 * The identity element of the abelian sandpile group on a square grid.
 *
 * ── What this is, and what it is not ──────────────────────────────────────
 *
 * PRD's opening names the model this game is built on: the abelian sandpile
 * (Dhar 1990, on Bak–Tang–Wiesenfeld 1987). That model has a group structure,
 * and its identity element — the configuration that changes nothing when added
 * to any other — is an intricate, entirely determined picture. Not chosen, not
 * drawn: computed, the same way every time, by the rule the game already runs.
 *
 * It is worth being exact about the difference, because the appeal of this
 * ornament is that it is the mathematics rather than a picture of it, and an
 * overclaim would spend that.
 *
 * The classical sandpile has an *absorbing boundary*: every vertex topples at
 * four, and chips that fall off the edge leave the system. That sink is what
 * makes the group finite and gives it an identity at all.
 *
 * Chipfire's board conserves chips — nothing leaves — and its threshold is the
 * cell's own neighbour count, so corners fire at two and edges at three
 * (invariant 7). That is a chip-firing game on a finite graph with no sink,
 * which is why a cascade there can run forever and why the engine checks for
 * victory inside the loop (invariant 5).
 *
 * So: same toppling rule, same family, different boundary. This draws the
 * classical object the game descends from, and the caption beside it says so
 * rather than implying it is a portrait of the board.
 *
 * Integers only, no clock, no randomness — the same discipline as the engine,
 * for the same reason: the picture has to be identical on every build.
 */

/** Every vertex has four neighbours; those off the grid are the sink. */
const DEGREE = 4

/**
 * Chips per cell in the starting configuration, `2 × (degree − 1)`.
 *
 * The recipe is standard: stabilise a uniformly over-full board, subtract the
 * result from where you started, and stabilise again. Six is the value that
 * makes it work on a 4-regular grid.
 */
const SATURATED = 2 * (DEGREE - 1)

export type Sandpile = {
  readonly size: number
  /** Chips per cell, row-major, every value in 0…3 once stable. */
  readonly cells: Uint8Array
}

/**
 * Topple until nothing is over its threshold.
 *
 * A worklist rather than repeated sweeps, and iterative rather than recursive —
 * the same reason the game's cascade is (invariant 3). Mutates in place; the
 * callers here own their arrays.
 */
function stabilize(cells: Int32Array, size: number): void {
  const pending: number[] = []
  const queued = new Uint8Array(cells.length)

  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] >= DEGREE) {
      pending.push(index)
      queued[index] = 1
    }
  }

  // Read head rather than shift(), which is O(n) per call and turns a large
  // grid from seconds into minutes.
  for (let head = 0; head < pending.length; head += 1) {
    const index = pending[head]
    queued[index] = 0
    if (cells[index] < DEGREE) continue

    const times = Math.floor(cells[index] / DEGREE)
    cells[index] -= times * DEGREE

    const row = Math.floor(index / size)
    const col = index % size

    // Off-grid neighbours are the sink: the chip leaves and is not counted.
    if (row > 0) give(index - size)
    if (row < size - 1) give(index + size)
    if (col > 0) give(index - 1)
    if (col < size - 1) give(index + 1)

    function give(neighbour: number): void {
      cells[neighbour] += times
      if (cells[neighbour] >= DEGREE && queued[neighbour] === 0) {
        pending.push(neighbour)
        queued[neighbour] = 1
      }
    }

    if (cells[index] >= DEGREE && queued[index] === 0) {
      pending.push(index)
      queued[index] = 1
    }
  }
}

/**
 * `e = stabilize( s − stabilize(s) )`, where `s` is every cell saturated.
 *
 * The subtraction is the whole trick: what the first stabilisation *removed* is
 * a configuration that annihilates itself, and stabilising that leaves the
 * element which adds nothing to anything.
 */
export function identity(size: number): Sandpile {
  if (!Number.isInteger(size) || size < 2) throw new Error(`bad sandpile size: ${size}`)

  const saturated = new Int32Array(size * size).fill(SATURATED)
  const settled = Int32Array.from(saturated)
  stabilize(settled, size)

  const difference = new Int32Array(size * size)
  for (let index = 0; index < difference.length; index += 1) {
    difference[index] = saturated[index] - settled[index]
  }
  stabilize(difference, size)

  return { size, cells: Uint8Array.from(difference) }
}

/** Add two configurations and let the result settle. */
export function add(left: Sandpile, right: Sandpile): Sandpile {
  if (left.size !== right.size) throw new Error('sandpiles must be the same size')
  const sum = new Int32Array(left.cells.length)
  for (let index = 0; index < sum.length; index += 1) {
    sum[index] = left.cells[index] + right.cells[index]
  }
  stabilize(sum, left.size)
  return { size: left.size, cells: Uint8Array.from(sum) }
}

/**
 * One path per height, as SVG path data.
 *
 * Three strings for the whole picture rather than a node per shape, and that is
 * not a micro-optimisation. A server component's output is serialised twice —
 * once as HTML and once into the flight payload React uses to hydrate — so
 * every attribute of every element is paid for two times over. Emitting 1,352
 * `<rect>` elements cost 18 kB gzipped on the landing page; the same picture as
 * three `d` strings costs a fraction of it, because the repetition compresses
 * and there is no per-element markup to repeat.
 *
 * Level 0 is the paper and is never drawn.
 */
export function paths(pile: Sandpile): readonly string[] {
  const parts: string[][] = [[], [], [], []]

  for (const [x, y, width, level] of runs(pile)) {
    // A one-row-tall rectangle: across, down one, back, close.
    parts[level].push(`M${x} ${y}h${width}v1h-${width}z`)
  }

  return [parts[1].join(''), parts[2].join(''), parts[3].join('')]
}

/**
 * Horizontal runs of equal height, per row.
 *
 * The identity is mostly large flat regions, so drawing one rectangle per cell
 * would emit tens of thousands of near-identical nodes for a picture that needs
 * a few thousand. Emitted as `[x, y, width, level]`.
 */
export function runs(pile: Sandpile): readonly (readonly [number, number, number, number])[] {
  const out: [number, number, number, number][] = []

  for (let row = 0; row < pile.size; row += 1) {
    let start = 0
    for (let col = 1; col <= pile.size; col += 1) {
      const here = col === pile.size ? -1 : pile.cells[row * pile.size + col]
      const previous = pile.cells[row * pile.size + start]
      if (here !== previous) {
        // Level 0 is the ground the picture sits on; drawing it would double
        // the node count to paint the background its own colour.
        if (previous > 0) out.push([start, row, col - start, previous])
        start = col
      }
    }
  }

  return out
}
