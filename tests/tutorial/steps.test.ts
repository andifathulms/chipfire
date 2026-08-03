import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { parseNotation } from '@/lib/engine/notation'
import { previewMove } from '@/lib/engine/preview'
import { isLegalMove } from '@/lib/engine/state'
import { TUTORIAL } from '@/lib/tutorial'

/**
 * The tutorial makes claims — five explosions here, a capture there, a win at
 * the end. Every claim is checked against the engine, because a lesson that
 * disagrees with the game teaches the wrong game.
 */
describe('tutorial steps', () => {
  it.each(TUTORIAL.map((step) => [step.id, step] as const))(
    '%s: every allowed cell is actually playable',
    (_id, step) => {
      const state = parseNotation(step.position)
      expect(step.allowed.length).toBeGreaterThan(0)

      for (const index of step.allowed) {
        expect(isLegalMove(state, { type: 'place', player: state.current, index })).toBe(true)
      }
    },
  )

  it.each(TUTORIAL.map((step) => [step.id, step] as const))(
    '%s: the stated outcome is what the engine does',
    (_id, step) => {
      const state = parseNotation(step.position)
      // The taught move is the first allowed cell; steps with a single lesson
      // pin it to exactly one.
      const preview = previewMove(state, step.allowed[0])

      expect(preview).not.toBeNull()
      expect(preview?.explosions).toBe(step.expect.explosions)
      expect(preview?.capturedCount).toBe(step.expect.captures)
      expect(preview?.wins).toBe(step.expect.wins)
    },
  )

  it.each(TUTORIAL.map((step) => [step.id, step] as const))(
    '%s: the lesson is not cut short by an accidental win',
    (_id, step) => {
      if (step.expect.wins) return
      const state = parseNotation(step.position)

      // Whichever allowed cell the learner picks, the opponent must survive it,
      // or the step ends before its point lands.
      for (const index of step.allowed) {
        const after = applyMove(state, { type: 'place', player: state.current, index }).state
        expect(after.winner).toBeNull()
      }
    },
  )
})
