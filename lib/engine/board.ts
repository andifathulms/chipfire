import { buildAdjacency, type Adjacency, type Dimensions } from './topology'

/**
 * The board is flat typed arrays indexed `row * cols + col` — not a 2D array of
 * objects. Flat is faster for AI search and trivially serialisable, and typed
 * arrays make the state hash a straight byte walk.
 */

export type PlayerId = number

/** Sentinel for "no owner". Typed arrays cannot hold null. */
export const NO_OWNER = -1

export const MIN_ROWS = 3
export const MAX_ROWS = 12
export const MIN_COLS = 3
export const MAX_COLS = 14
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4

export const DEFAULT_ROWS = 6
export const DEFAULT_COLS = 9

export type Board = {
  readonly rows: number
  readonly cols: number
  /** Owner per cell, or NO_OWNER. */
  readonly owners: Int8Array
  /** Orb count per cell. */
  readonly counts: Uint8Array
  /** Shared, immutable. Never copied on a move. */
  readonly adjacency: Adjacency
}

export function createBoard(rows: number = DEFAULT_ROWS, cols: number = DEFAULT_COLS): Board {
  if (!Number.isInteger(rows) || !Number.isInteger(cols)) {
    throw new Error('board dimensions must be integers')
  }
  if (rows < MIN_ROWS || rows > MAX_ROWS) throw new Error(`rows out of bounds: ${rows}`)
  if (cols < MIN_COLS || cols > MAX_COLS) throw new Error(`cols out of bounds: ${cols}`)

  const dim: Dimensions = { rows, cols }
  const size = rows * cols

  return {
    rows,
    cols,
    owners: new Int8Array(size).fill(NO_OWNER),
    counts: new Uint8Array(size),
    adjacency: buildAdjacency(dim),
  }
}

/** Structural copy. Adjacency is shared because it never changes. */
export function cloneBoard(board: Board): Board {
  return {
    rows: board.rows,
    cols: board.cols,
    owners: Int8Array.from(board.owners),
    counts: Uint8Array.from(board.counts),
    adjacency: board.adjacency,
  }
}

export function boardSize(board: Board): number {
  return board.rows * board.cols
}

export function criticalMass(board: Board, index: number): number {
  return board.adjacency.criticalMass[index]
}

/**
 * Iterate neighbours positionally. Callers must never collect these into a Set
 * and iterate that — collection order is exactly the class of nondeterminism
 * this project cannot tolerate.
 */
export function forEachNeighbour(
  board: Board,
  index: number,
  visit: (neighbour: number) => void,
): void {
  const { start, list } = board.adjacency
  const from = start[index]
  const to = start[index + 1]
  for (let i = from; i < to; i += 1) visit(list[i])
}

/** Debug rendering: `.` empty, otherwise `<player><count>`. */
export function formatBoard(board: Board): string {
  const lines: string[] = []
  for (let row = 0; row < board.rows; row += 1) {
    const cells: string[] = []
    for (let col = 0; col < board.cols; col += 1) {
      const index = row * board.cols + col
      const owner = board.owners[index]
      cells.push(owner === NO_OWNER ? ' . ' : `${owner}${board.counts[index]} `)
    }
    lines.push(cells.join(''))
  }
  return lines.join('\n')
}
