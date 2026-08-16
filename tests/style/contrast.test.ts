import { describe, expect, it } from 'vitest'
import { buildChecks, readPalettes } from '@/scripts/contrast.mjs'

/**
 * The palette's own comments in app/globals.css assert WCAG ratios by hand —
 * for both the light stock and the night ground DESIGN-REWORK.md §7 asked to
 * have "the same treatment the light ones got". This is that treatment made
 * permanent: a token edit that quietly drops a ratio below AA fails here
 * instead of shipping silently, in both colour schemes, against both grounds
 * each token is actually painted on (chart stock and chart stock deep).
 */
describe('WCAG contrast', () => {
  const palettes = readPalettes()
  const checks = buildChecks(palettes)

  it('found something to check in both schemes', () => {
    expect(checks.filter((c) => c.scheme === 'light').length).toBeGreaterThan(0)
    expect(checks.filter((c) => c.scheme === 'dark').length).toBeGreaterThan(0)
  })

  it.each(checks)(
    '$scheme: $token on $ground clears 4.5:1 ($ratio)',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    },
  )
})
