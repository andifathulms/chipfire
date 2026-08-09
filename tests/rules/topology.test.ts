import { describe, expect, it } from 'vitest'
import { MAX_COLS, createBoard, criticalMass } from '@/lib/engine/board'
import { cellName } from '@/lib/engine/notation'
import { neighbours } from '@/lib/engine/topology'
import { applyMove } from '@/lib/engine/apply'
import { parseState } from '../helpers'

describe('topology is the source of critical mass', () => {
  const board = createBoard(3, 3)

  it('derives 2 in corners, 3 on edges, 4 in the interior', () => {
    expect(criticalMass(board, 0)).toBe(2) // corner
    expect(criticalMass(board, 1)).toBe(3) // edge
    expect(criticalMass(board, 4)).toBe(4) // interior
    expect(criticalMass(board, 8)).toBe(2) // corner
  })

  it('returns neighbours in a fixed scan order: up, left, right, down', () => {
    expect(neighbours({ rows: 3, cols: 3 }, 4)).toEqual([1, 3, 5, 7])
    expect(neighbours({ rows: 3, cols: 3 }, 0)).toEqual([1, 3])
    expect(neighbours({ rows: 3, cols: 3 }, 8)).toEqual([5, 7])
  })

  it('scales the derivation to any dimensions without special cases', () => {
    const wide = createBoard(6, 9)
    expect(criticalMass(wide, 0)).toBe(2)
    expect(criticalMass(wide, 4)).toBe(3) // top edge
    expect(criticalMass(wide, 9 * 3 + 4)).toBe(4) // interior
    expect(criticalMass(wide, 6 * 9 - 1)).toBe(2) // bottom-right corner
  })
})

describe('thresholds differ by position', () => {
  it('does not explode an interior cell at 3', () => {
    const state = parseState({
      board: `
        .  .  .
        .  A2 .
        .  .  B1
      `,
    })

    const { state: next, events } = applyMove(state, { type: 'place', player: 0, index: 4 })

    expect(next.board.counts[4]).toBe(3)
    expect(events.map((event) => event.type)).toEqual(['place'])
  })

  it('explodes an edge cell at 3', () => {
    const state = parseState({
      board: `
        .  A2 .
        .  .  B1
        .  .  .
      `,
    })

    const { events } = applyMove(state, { type: 'place', player: 0, index: 1 })

    expect(events.map((event) => event.type)).toEqual([
      'place',
      'explode',
      'convert',
      'convert',
      'convert',
    ])
  })
})

describe('cell names', () => {
  it('names a cell by column letter and 1-based row', () => {
    // 9 columns: index 0 is the top-left, index 31 is row 4, column 5.
    expect(cellName(9, 0)).toBe('a1')
    expect(cellName(9, 8)).toBe('i1')
    expect(cellName(9, 9)).toBe('a2')
    expect(cellName(9, 31)).toBe('e4')
  })

  it('covers the widest board the rules allow', () => {
    expect(cellName(MAX_COLS, MAX_COLS - 1)).toBe('n1')
  })
})
