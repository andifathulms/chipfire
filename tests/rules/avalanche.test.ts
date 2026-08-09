import { describe, expect, it } from 'vitest'
import { AVALANCHE_BUCKETS, AVALANCHE_RANGES, avalancheBucket } from '@/lib/stats'
import { summariseMoves } from '@/lib/engine/replay'
import { playRandomGame } from '../random'

describe('avalanche buckets', () => {
  it('does not count a move that set nothing off', () => {
    // Most moves are quiet. Counting them would bury the distribution under
    // the majority case and say nothing about avalanches at all.
    expect(avalancheBucket(0)).toBe(-1)
    expect(avalancheBucket(-1)).toBe(-1)
  })

  it('gives the smallest avalanches a bucket each', () => {
    expect(avalancheBucket(1)).toBe(0)
    expect(avalancheBucket(2)).toBe(1)
  })

  it('doubles from there', () => {
    expect(avalancheBucket(3)).toBe(2)
    expect(avalancheBucket(4)).toBe(2)
    expect(avalancheBucket(5)).toBe(3)
    expect(avalancheBucket(8)).toBe(3)
    expect(avalancheBucket(9)).toBe(4)
    expect(avalancheBucket(16)).toBe(4)
    expect(avalancheBucket(17)).toBe(5)
    expect(avalancheBucket(32)).toBe(5)
    expect(avalancheBucket(33)).toBe(6)
    expect(avalancheBucket(64)).toBe(6)
  })

  it('puts everything past the last boundary in the tail', () => {
    expect(avalancheBucket(65)).toBe(7)
    expect(avalancheBucket(5000)).toBe(7)
  })

  it('agrees with the ranges it is described by', () => {
    // The labels the chart draws come from AVALANCHE_RANGES. If the function
    // and the ranges ever disagreed, the axis would be lying about the bars.
    expect(AVALANCHE_RANGES).toHaveLength(AVALANCHE_BUCKETS)

    AVALANCHE_RANGES.forEach(([low, high], bucket) => {
      expect(avalancheBucket(low)).toBe(bucket)
      if (high !== 0) {
        expect(avalancheBucket(high)).toBe(bucket)
        expect(avalancheBucket(high + 1)).toBe(bucket + 1)
      }
    })
  })

  it('never returns a bucket outside the array it indexes', () => {
    for (let explosions = -5; explosions <= 300; explosions += 1) {
      const bucket = avalancheBucket(explosions)
      expect(bucket).toBeGreaterThanOrEqual(-1)
      expect(bucket).toBeLessThan(AVALANCHE_BUCKETS)
    }
  })
})

describe('what real games actually produce', () => {
  /**
   * Not an assertion about the exponent — that would be a claim this project
   * cannot cite. It asserts the shape the buckets exist to show: small
   * avalanches vastly outnumber large ones, and the tail is not empty. If a
   * change to the cascade ever flattened that, this is where it would surface.
   */
  it('falls away monotonically from the smallest bucket to the tail', () => {
    const counts = Array.from({ length: AVALANCHE_BUCKETS }, () => 0)
    let quiet = 0

    // A fixed, seeded corpus: this either holds or the distribution genuinely
    // changed, and a change in the distribution is exactly what should fail here.
    for (let seed = 1; seed <= 60; seed += 1) {
      const game = playRandomGame({ rows: 6, cols: 9, players: 2, seed })
      for (const move of summariseMoves(game.record)) {
        const bucket = avalancheBucket(move.explosions)
        if (bucket >= 0) counts[bucket] += 1
        else quiet += 1
      }
    }

    const total = counts.reduce((sum, value) => sum + value, 0)
    expect(total).toBeGreaterThan(500)

    // Each bucket spans twice the range of the one before it and still holds
    // fewer avalanches. That is the heavy tail, asserted as a shape rather
    // than as an exponent — an exponent would be a number this project could
    // not cite to a rule.
    for (let bucket = 1; bucket < AVALANCHE_BUCKETS; bucket += 1) {
      expect(counts[bucket]).toBeLessThanOrEqual(counts[bucket - 1])
    }

    // Both ends are real: the smallest bucket dominates, and the largest is
    // not empty. A distribution with an empty tail would not be worth drawing.
    expect(counts[0]).toBeGreaterThan(total / 4)
    expect(counts[AVALANCHE_BUCKETS - 1]).toBeGreaterThan(0)

    // And the quiet majority is quieter still — most moves set nothing off.
    expect(quiet).toBeGreaterThan(total)
  })
})
