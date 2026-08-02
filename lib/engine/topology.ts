/**
 * Adjacency is the single source of truth for the rules.
 *
 * Critical mass is *derived* from the neighbour count — never hardcoded as
 * 2/3/4 and never branched on "is this a corner". That is what keeps hex or
 * toroidal boards a later addition rather than a rewrite (PRD §10).
 *
 * The order neighbours come back in is part of the rules, not an implementation
 * detail: it fixes the order orbs are distributed and enqueued during a cascade,
 * which is what makes the cascade byte-identical across devices.
 */

/** Fixed scan order: up, left, right, down. Do not reorder. */
const OFFSETS: readonly (readonly [dRow: number, dCol: number])[] = [
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, 0],
]

export type Dimensions = {
  readonly rows: number
  readonly cols: number
}

export function indexOf(dim: Dimensions, row: number, col: number): number {
  return row * dim.cols + col
}

export function rowOf(dim: Dimensions, index: number): number {
  return Math.floor(index / dim.cols)
}

export function colOf(dim: Dimensions, index: number): number {
  return index % dim.cols
}

/**
 * Orthogonal neighbours of a cell, in fixed scan order.
 * Rectangular, non-wrapping. Swapping this function is how a new topology ships.
 */
export function neighbours(dim: Dimensions, index: number): number[] {
  const row = rowOf(dim, index)
  const col = colOf(dim, index)
  const out: number[] = []

  for (const offset of OFFSETS) {
    const r = row + offset[0]
    const c = col + offset[1]
    if (r < 0 || r >= dim.rows || c < 0 || c >= dim.cols) continue
    out.push(indexOf(dim, r, c))
  }

  return out
}

/**
 * Adjacency in compressed sparse row form: `list[start[i] .. start[i + 1])` are
 * the neighbours of cell i. Flat typed arrays, so indexing never yields
 * `undefined` and iteration order is positional rather than collection order.
 */
export type Adjacency = {
  readonly start: Int32Array
  readonly list: Int32Array
  /** Critical mass per cell, derived from the neighbour count. */
  readonly criticalMass: Uint8Array
}

export function buildAdjacency(dim: Dimensions): Adjacency {
  const size = dim.rows * dim.cols
  const start = new Int32Array(size + 1)
  const criticalMass = new Uint8Array(size)
  const list: number[] = []

  for (let index = 0; index < size; index += 1) {
    start[index] = list.length
    const adjacent = neighbours(dim, index)
    for (const n of adjacent) list.push(n)
    criticalMass[index] = adjacent.length
  }
  start[size] = list.length

  return { start, list: Int32Array.from(list), criticalMass }
}
