import { describe, expect, it } from 'vitest'
import { SEISMOGRAM } from '@/components/hud/Seismogram'
import { AVALANCHE_RANGES, avalancheBucket } from '@/lib/stats'

const { levelFor, VIEW_HEIGHT, QUIET } = SEISMOGRAM

/**
 * The strip and the end-of-game distribution are two views of one number, so
 * they have to agree about how big a cascade was. If they ever disagreed, a
 * player would see a tall spike during the game and find it counted in a
 * shorter bucket afterwards, with nothing to say which was lying.
 */
describe('the seismogram scale', () => {
  it('marks a quiet move without pretending it did not happen', () => {
    // A gap would read as a missing turn. A short mark reads as a turn that
    // set nothing off, which is what actually occurred.
    expect(levelFor(0)).toBe(QUIET)
    expect(QUIET).toBeGreaterThan(0)
  })

  it('puts the smallest real avalanche clearly above a quiet move', () => {
    expect(levelFor(1)).toBeGreaterThan(QUIET + 1)
  })

  it('rises with every doubling bucket and never falls', () => {
    let previous = 0
    for (const [low] of AVALANCHE_RANGES) {
      const level = levelFor(low)
      expect(level).toBeGreaterThanOrEqual(previous)
      previous = level
    }
  })

  it('is the distribution’s own classification, not a second one', () => {
    for (let explosions = 1; explosions <= 200; explosions += 1) {
      const bucket = avalancheBucket(explosions)
      // Same bucket, same height — that is the whole guarantee.
      expect(levelFor(explosions)).toBe(Math.min(VIEW_HEIGHT, bucket + 2))
    }
  })

  it('never draws outside the strip', () => {
    for (let explosions = 0; explosions <= 5000; explosions += 1) {
      const level = levelFor(explosions)
      expect(level).toBeGreaterThan(0)
      expect(level).toBeLessThanOrEqual(VIEW_HEIGHT)
    }
  })

  it('gives the largest bucket the full height, so the tail is visible', () => {
    expect(levelFor(65)).toBe(VIEW_HEIGHT)
    expect(levelFor(5000)).toBe(VIEW_HEIGHT)
  })
})
