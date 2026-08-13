import { describe, expect, it } from 'vitest'
import { buildAfterglow } from '@/components/cascade/frames'
import { applyMove } from '@/lib/engine/apply'
import { parseNotation } from '@/lib/engine/notation'

/**
 * The afterglow is the one thing the board says about how a position was
 * reached rather than what it is, so it has to agree with the event stream it
 * is read from.
 */
describe('the afterglow', () => {
  const start = parseNotation({ board: `A1 A2 .\nA2 A3 .\n.  .  B1`, current: 0 })
  const { events } = applyMove(start, { type: 'place', player: 0, index: 0 })
  const glow = buildAfterglow(9, events)

  it('marks every cell that fired, and only those', () => {
    expect(glow).not.toBeNull()
    if (glow === null) return

    const fired = new Set(events.filter((e) => e.type === 'explode').map((e) => e.index))
    glow.cells.forEach((value, index) => {
      expect(value > 0).toBe(fired.has(index))
    })
  })

  it('remembers the last generation a cell fired in, not the first', () => {
    if (glow === null) return
    // A cell can go off more than once in a chain; the most recent time is the
    // one that should show, or the trace would fade the wrong way round.
    for (const event of events) {
      if (event.type !== 'explode') continue
      expect(glow.cells[event.index]).toBeGreaterThanOrEqual(event.step + 1)
    }
  })

  it('reports a depth that covers every generation', () => {
    if (glow === null) return
    const deepest = Math.max(
      ...events.filter((e) => e.type === 'explode').map((e) => ('step' in e ? e.step : 0)),
    )
    expect(glow.depth).toBe(deepest + 1)
    // Intensity divides by depth, so a zero would put every cell at infinity.
    expect(glow.depth).toBeGreaterThan(0)
  })

  it('stays inside the 0…1 range the intensity is scaled by', () => {
    if (glow === null) return
    glow.cells.forEach((value) => {
      if (value === 0) return
      const t = (value - 1) / glow.depth
      expect(t).toBeGreaterThanOrEqual(0)
      expect(t).toBeLessThan(1)
    })
  })

  it('has nothing to say about a move that set nothing off', () => {
    const quiet = applyMove(parseNotation({ board: `.  .  .\n.  .  .\n.  .  .` }), {
      type: 'place',
      player: 0,
      index: 4,
    })
    expect(buildAfterglow(9, quiet.events)).toBeNull()
  })
})
