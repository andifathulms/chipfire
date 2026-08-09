import { NO_OWNER, createBoard, type PlayerId } from './board'
import { createGame, type GameState } from './state'

/**
 * Board notation: rows of tokens, `.` for empty, otherwise a letter for the
 * owner (A = player 0, B = player 1, …) followed by the orb count.
 *
 *   A1 .  .
 *   .  B3 .
 *
 * Used by the hand-authored rules fixtures and by the tutorial, which is why it
 * lives here rather than in the test helpers: a tutorial that claimed one thing
 * while the fixtures asserted another would be worse than no tutorial.
 */
export const OWNER_LETTERS = 'ABCD'

export type Notation = {
  readonly board: string
  readonly players?: number
  readonly current?: PlayerId
  /** Players already considered to have taken a turn. Defaults to all of them,
   *  because a mid-game position is by definition past the opening. */
  readonly moved?: readonly PlayerId[]
}

export function parseRows(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
}

export function parseNotation(notation: Notation): GameState {
  const rows = parseRows(notation.board)
  const height = rows.length
  const width = rows[0].length
  for (const row of rows) {
    if (row.length !== width) throw new Error('notation rows must all be the same width')
  }

  const players = notation.players ?? 2
  const base = createGame({ rows: height, cols: width, players, seed: 1 })
  const board = createBoard(height, width)
  const orbs = new Int32Array(players)

  rows.forEach((row, r) => {
    row.forEach((token, c) => {
      if (token === '.') return
      const index = r * width + c
      const owner = OWNER_LETTERS.indexOf(token[0].toUpperCase())
      const count = Number(token.slice(1))
      if (owner < 0 || owner >= players) throw new Error(`bad owner in token ${token}`)
      if (!Number.isInteger(count) || count <= 0) throw new Error(`bad count in token ${token}`)
      board.owners[index] = owner
      board.counts[index] = count
      orbs[owner] += count
    })
  })

  const hasMoved = new Uint8Array(players)
  const moved = notation.moved ?? Array.from({ length: players }, (_, player) => player)
  for (const player of moved) hasMoved[player] = 1

  return {
    ...base,
    board,
    orbs,
    hasMoved,
    current: notation.current ?? 0,
    turn: 1,
  }
}

/** Column letters, so a cell has a name a player can say out loud. */
const COLUMN_LETTERS = 'abcdefghijklmn'

/**
 * A cell's name: column letter, then 1-based row — `c4`.
 *
 * Anywhere two people have to refer to the same cell — a move list, a report
 * that two games diverged at a particular turn — "index 31" is a number about
 * the array and `c4` is a name for the square. The letters cover MAX_COLS.
 */
export function cellName(cols: number, index: number): string {
  const row = Math.floor(index / cols) + 1
  const column = COLUMN_LETTERS[index % cols] ?? '?'
  return `${column}${row}`
}

/** Render a state back into notation, so failures read as boards. */
export function renderNotation(state: GameState): string {
  const { rows, cols, owners, counts } = state.board
  const lines: string[] = []
  for (let r = 0; r < rows; r += 1) {
    const cells: string[] = []
    for (let c = 0; c < cols; c += 1) {
      const index = r * cols + c
      const owner = owners[index]
      cells.push(owner === NO_OWNER ? '. ' : `${OWNER_LETTERS[owner]}${counts[index]}`)
    }
    lines.push(cells.join(' '))
  }
  return lines.join('\n')
}
