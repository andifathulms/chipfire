import { NO_OWNER, createBoard, type PlayerId } from '@/lib/engine/board'
import { createGame, type GameState } from '@/lib/engine/state'

/**
 * Hand-authored board fixtures.
 *
 * A board is written as rows of tokens: `.` for empty, otherwise a letter for
 * the owner (A = player 0, B = player 1, …) followed by the orb count. Stated
 * input, stated output — a fixture that computes its expectation proves nothing.
 *
 *   parseBoard(`
 *     A1 .  .
 *     .  B3 .
 *   `)
 */
const LETTERS = 'ABCD'

export type Fixture = {
  readonly board: string
  readonly players?: number
  readonly current?: PlayerId
  /** Players already considered to have taken a turn. Defaults to all of them,
   *  because a mid-game fixture is by definition past the opening. */
  readonly moved?: readonly PlayerId[]
}

function parseRows(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
}

export function parseState(fixture: Fixture): GameState {
  const rows = parseRows(fixture.board)
  const height = rows.length
  const width = rows[0].length
  for (const row of rows) {
    if (row.length !== width) throw new Error('fixture rows must all be the same width')
  }

  const players = fixture.players ?? 2
  const state = createGame({ rows: height, cols: width, players, seed: 1 })
  const board = createBoard(height, width)
  const orbs = new Int32Array(players)

  rows.forEach((row, r) => {
    row.forEach((token, c) => {
      const index = r * width + c
      if (token === '.') return
      const owner = LETTERS.indexOf(token[0].toUpperCase())
      const count = Number(token.slice(1))
      if (owner < 0 || owner >= players) throw new Error(`bad owner in token ${token}`)
      if (!Number.isInteger(count) || count <= 0) throw new Error(`bad count in token ${token}`)
      board.owners[index] = owner
      board.counts[index] = count
      orbs[owner] += count
    })
  })

  const hasMoved = new Uint8Array(players)
  const moved = fixture.moved ?? Array.from({ length: players }, (_, p) => p)
  for (const player of moved) hasMoved[player] = 1

  return {
    ...state,
    board,
    orbs,
    hasMoved,
    current: fixture.current ?? 0,
    turn: 1,
  }
}

/** Render a state back into fixture notation, so failures read as boards. */
export function renderBoard(state: GameState): string {
  const { rows, cols, owners, counts } = state.board
  const lines: string[] = []
  for (let r = 0; r < rows; r += 1) {
    const cells: string[] = []
    for (let c = 0; c < cols; c += 1) {
      const index = r * cols + c
      const owner = owners[index]
      cells.push(owner === NO_OWNER ? '. ' : `${LETTERS[owner]}${counts[index]}`)
    }
    lines.push(cells.join(' '))
  }
  return lines.join('\n')
}

export function expectBoard(expected: string): string {
  return parseRows(expected)
    .map((row) => row.map((token) => (token === '.' ? '. ' : token)).join(' '))
    .join('\n')
}
