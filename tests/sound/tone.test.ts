import { describe, expect, it } from 'vitest'
import { BASE_FREQUENCY, toneFor } from '@/lib/sound'

/**
 * The only part of the sound layer with logic in it. Everything else is Web
 * Audio calls, which need a browser to mean anything; this is the ladder that
 * makes cascade depth audible, and it is arithmetic.
 */
describe('the cascade ladder', () => {
  it('starts at the base note', () => {
    expect(toneFor(0)).toBe(BASE_FREQUENCY)
  })

  it('climbs a semitone per generation', () => {
    // Twelve steps is an octave, which is the check worth writing: if the
    // exponent base or divisor ever drifted, this is what would catch it.
    expect(toneFor(12)).toBeCloseTo(BASE_FREQUENCY * 2, 5)
    expect(toneFor(24)).toBeCloseTo(BASE_FREQUENCY * 4, 5)
  })

  it('rises monotonically', () => {
    for (let generation = 1; generation <= 30; generation += 1) {
      expect(toneFor(generation)).toBeGreaterThanOrEqual(toneFor(generation - 1))
    }
  })

  it('stops climbing rather than running out of hearing', () => {
    /*
     * A forty-generation chain is exactly the cascade worth hearing, and an
     * uncapped ladder would put its tail above 20kHz — which reads as the sound
     * breaking, not as a long cascade.
     */
    const ceiling = toneFor(24)
    expect(toneFor(40)).toBe(ceiling)
    expect(toneFor(400)).toBe(ceiling)
    expect(ceiling).toBeLessThan(20_000)
  })

  it('has no opinion below zero', () => {
    expect(toneFor(-1)).toBe(BASE_FREQUENCY)
    expect(toneFor(-100)).toBe(BASE_FREQUENCY)
  })
})
