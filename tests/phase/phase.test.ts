import { describe, expect, it } from 'vitest'
import { derivePhase, type Phase } from '@/lib/phase'
import { cascadeDepth } from '@/lib/engine/events'
import { replayFrames } from '@/lib/engine/replay'
import { configFor, playRandomGame } from '../random'

const GAME_COUNT = 60

/**
 * DESIGN-REWORK.md §7: "a phase test... For a set of recorded games, assert
 * which instruments are mounted at each move." No UI reads `Phase` yet
 * (that's build order step 4) — this is the phase itself, walked across a
 * corpus of finished games, which is what keeps a later console gating from
 * silently drifting as new panels are added.
 */
describe('derivePhase over recorded games', () => {
  const games = Array.from({ length: GAME_COUNT }, (_, index) => playRandomGame(configFor(index)))

  it('opens on siap, exactly once, before any move', () => {
    for (const game of games) {
      const frames = replayFrames(game.record)
      const phases = frames.map((frame, i) =>
        derivePhase({
          movesPlayed: i,
          winner: frame.state.winner,
          lastCascadeEvents: i === 0 ? null : frames[i].events,
        }),
      )
      expect(phases[0]).toBe('siap')
      expect(phases.filter((p) => p === 'siap')).toHaveLength(1)
    }
  })

  it('ends on selesai, and only once the winner is decided', () => {
    for (const game of games) {
      const frames = replayFrames(game.record)
      const last = frames.at(-1)
      expect(last?.state.winner).not.toBeNull()

      frames.forEach((frame, i) => {
        const phase = derivePhase({
          movesPlayed: i,
          winner: frame.state.winner,
          lastCascadeEvents: i === 0 ? null : frames[i].events,
        })
        expect(phase === 'selesai').toBe(frame.state.winner !== null)
      })
    }
  })

  it('is longsor exactly on the turns that just resolved a multi-generation cascade, main otherwise', () => {
    for (const game of games) {
      const frames = replayFrames(game.record)

      for (let i = 1; i < frames.length; i += 1) {
        const frame = frames[i]
        if (frame.state.winner !== null) continue // selesai takes over; covered above

        const phase = derivePhase({
          movesPlayed: i,
          winner: frame.state.winner,
          lastCascadeEvents: frame.events,
        })

        const depth = cascadeDepth(frame.events)
        const expected: Phase = depth >= 2 ? 'longsor' : 'main'
        expect(phase).toBe(expected)
      }
    }
  })

  it('demotes on the very next move when that move is quiet: longsor does not linger on its own', () => {
    // Not "longsor never repeats" — two consecutive moves can each
    // independently trigger their own multi-generation cascade, and the
    // previous test already covers every frame on its own merits. What
    // "demotes" actually promises is narrower: a longsor turn is not sticky
    // state that persists into a quiet next move just because it was
    // longsor a moment ago. Find that concrete case in the corpus and check it.
    let checked = 0
    for (const game of games) {
      const frames = replayFrames(game.record)

      for (let i = 1; i < frames.length - 1; i += 1) {
        const here = derivePhase({
          movesPlayed: i,
          winner: frames[i].state.winner,
          lastCascadeEvents: frames[i].events,
        })
        if (here !== 'longsor') continue
        if (cascadeDepth(frames[i + 1].events) >= 2) continue // also longsor, on its own merits

        const next = derivePhase({
          movesPlayed: i + 1,
          winner: frames[i + 1].state.winner,
          lastCascadeEvents: frames[i + 1].events,
        })
        expect(next).not.toBe('longsor')
        checked += 1
      }
    }
    // A vacuous pass (never finding longsor-then-quiet in 60 games) would
    // hide a regression rather than confirm one, so require the case exists.
    expect(checked).toBeGreaterThan(0)
  })

  it('never reports longsor when the mode does not support it, even across the same cascade', () => {
    for (const game of games) {
      const frames = replayFrames(game.record)

      for (let i = 1; i < frames.length; i += 1) {
        const frame = frames[i]
        const phase = derivePhase({
          movesPlayed: i,
          winner: frame.state.winner,
          lastCascadeEvents: frame.events,
          supportsLongsor: false,
        })
        expect(phase).not.toBe('longsor')
        expect(phase).toBe(frame.state.winner !== null ? 'selesai' : 'main')
      }
    }
  })

  it('single-orb placements that trigger nothing stay in main, never longsor', () => {
    for (const game of games) {
      const frames = replayFrames(game.record)
      for (let i = 1; i < frames.length; i += 1) {
        const frame = frames[i]
        if (frame.state.winner !== null) continue
        if (cascadeDepth(frame.events) > 0) continue // a quiet move has none

        const phase = derivePhase({
          movesPlayed: i,
          winner: frame.state.winner,
          lastCascadeEvents: frame.events,
        })
        expect(phase).toBe('main')
      }
    }
  })
})
