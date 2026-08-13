import { describe, expect, it } from 'vitest'
import { add, identity, runs } from '@/lib/sandpile'

/**
 * The ornament is only worth having because it is the mathematics rather than
 * a picture of it, so the mathematics is what gets asserted. Every one of these
 * would fail on a drawing that merely looked right.
 */
describe('the sandpile identity', () => {
  const e = identity(48)

  it('is the identity — adding it to itself changes nothing', () => {
    // The defining property of the group's neutral element. Nothing else about
    // this file matters if this fails.
    expect(Array.from(add(e, e).cells)).toEqual(Array.from(e.cells))
  })

  it('leaves any recurrent configuration alone', () => {
    // e is recurrent, and so is e added to itself any number of times; adding
    // the identity to one of those has to be a no-op too.
    const twice = add(e, e)
    expect(Array.from(add(twice, e).cells)).toEqual(Array.from(twice.cells))
  })

  it('is stable — nothing is left above the threshold', () => {
    for (const height of e.cells) expect(height).toBeLessThan(4)
  })

  it('carries the square’s symmetry, both flips and the diagonal', () => {
    // The strongest cheap check that the toppling is right: a bug in the
    // neighbour arithmetic breaks one of these three almost immediately.
    const n = e.size
    const at = (row: number, col: number) => e.cells[row * n + col]

    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        expect(at(row, col)).toBe(at(row, n - 1 - col))
        expect(at(row, col)).toBe(at(n - 1 - row, col))
        expect(at(row, col)).toBe(at(col, row))
      }
    }
  })

  it('is the same picture on every build', () => {
    // It is baked into the page at build time, so a second run that disagreed
    // would mean the site's ornament depended on something it must not.
    expect(Array.from(identity(48).cells)).toEqual(Array.from(e.cells))
  })

  it('refuses a size that is not a grid', () => {
    expect(() => identity(1)).toThrow()
    expect(() => identity(4.5)).toThrow()
  })
})

describe('run-length encoding for the drawing', () => {
  const e = identity(32)

  it('covers every non-empty cell exactly once', () => {
    const painted = new Uint8Array(e.cells.length)
    for (const [x, y, width, level] of runs(e)) {
      expect(level).toBeGreaterThan(0)
      for (let step = 0; step < width; step += 1) {
        const index = y * e.size + x + step
        expect(painted[index]).toBe(0)
        expect(e.cells[index]).toBe(level)
        painted[index] = 1
      }
    }

    e.cells.forEach((height, index) => {
      expect(painted[index]).toBe(height > 0 ? 1 : 0)
    })
  })

  it('is worth doing — far fewer shapes than cells', () => {
    // If this ever stopped holding, the drawing would be emitting a node per
    // cell and the page would carry the weight of it.
    expect(runs(e).length).toBeLessThan(e.cells.length / 2)
  })
})
