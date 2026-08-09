import { describe, expect, it } from 'vitest'
import {
  FIGURE_AFTER,
  FIGURE_BEFORE,
  FIGURE_COLS,
  FIGURE_MOVE,
  FIGURE_POSITION,
} from '@/components/site/CascadeFigure'
import { applyMove } from '@/lib/engine/apply'
import { NO_OWNER } from '@/lib/engine/board'
import { parseNotation } from '@/lib/engine/notation'
import type { BoardView } from '@/components/board/Board'

/**
 * The landing figure is hand-written literals rather than a live board, for
 * the reasons the component explains. Literals drift. This is what stops the
 * first thing a visitor sees from quietly becoming a picture of a game these
 * rules do not produce — which, on a project whose entire pitch is that the
 * simulation is exact, would be the worst possible place to be wrong.
 */
function toCells(view: BoardView): [number, number][] {
  return Array.from(view.owners, (owner, index) =>
    owner === NO_OWNER ? [-1, 0] : [owner, view.counts[index]],
  )
}

describe('landing cascade figure', () => {
  const start = parseNotation(FIGURE_POSITION)

  it('draws the position the notation describes', () => {
    expect(start.board.cols).toBe(FIGURE_COLS)
    expect(toCells(start.board)).toEqual(FIGURE_BEFORE.map((cell) => [...cell]))
  })

  it('draws what applyMove actually produces', () => {
    const { state } = applyMove(start, {
      type: 'place',
      player: start.current,
      index: FIGURE_MOVE,
    })
    expect(toCells(state.board)).toEqual(FIGURE_AFTER.map((cell) => [...cell]))
  })

  it('is worth showing — the move has to cascade and take territory', () => {
    const { events } = applyMove(start, {
      type: 'place',
      player: start.current,
      index: FIGURE_MOVE,
    })
    const explosions = events.filter((event) => event.type === 'explode')
    const captures = events.filter((event) => event.type === 'convert')

    // A single explosion illustrates the threshold but not the chain, and the
    // chain is the reason anyone would play this.
    expect(explosions.length).toBeGreaterThanOrEqual(3)
    expect(captures.length).toBeGreaterThanOrEqual(6)
  })
})
