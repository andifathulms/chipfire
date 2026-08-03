import {
  parseNotation,
  parseRows,
  renderNotation,
  type Notation,
} from '@/lib/engine/notation'
import type { GameState } from '@/lib/engine/state'

/**
 * Hand-authored board fixtures. Stated input, stated output — a fixture that
 * computes its own expectation proves nothing.
 *
 * The notation itself lives in lib/engine, because the tutorial reads the same
 * boards and must be describing the same game.
 */
export type Fixture = Notation

export function parseState(fixture: Fixture): GameState {
  return parseNotation(fixture)
}

export function renderBoard(state: GameState): string {
  return renderNotation(state)
}

export function expectBoard(expected: string): string {
  return parseRows(expected)
    .map((row) => row.map((token) => (token === '.' ? '. ' : token)).join(' '))
    .join('\n')
}
