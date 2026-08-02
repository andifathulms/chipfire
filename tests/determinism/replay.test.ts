import { describe, expect, it } from 'vitest'
import { hashState } from '@/lib/engine/hash'
import { replay, replayFrames, replayHashes } from '@/lib/engine/replay'
import { configFor, playRandomGame } from '../random'

/**
 * The determinism property, asserted across a generated corpus.
 *
 * If this fails, stop and find the source. Do not retry, do not add a
 * tolerance, do not reseed: a nondeterminism that is "usually fine" desyncs a
 * real game at the worst possible moment.
 */
const CORPUS = 400

describe('replay reproduces the game byte-identically', () => {
  it('rebuilds the final state from the move list alone', () => {
    for (let index = 0; index < CORPUS; index += 1) {
      const played = playRandomGame(configFor(index))
      const rebuilt = replay(played.record)

      expect(hashState(rebuilt)).toBe(hashState(played.final))
      expect(Array.from(rebuilt.board.owners)).toEqual(Array.from(played.final.board.owners))
      expect(Array.from(rebuilt.board.counts)).toEqual(Array.from(played.final.board.counts))
      expect(rebuilt.winner).toBe(played.final.winner)
    }
  })

  it('produces the same hash on repeated replays of the same record', () => {
    for (let index = 0; index < 50; index += 1) {
      const played = playRandomGame(configFor(index))
      const first = replayHashes(played.record)
      const second = replayHashes(played.record)
      expect(second).toEqual(first)
    }
  })

  it('exposes one frame per move plus the opening position', () => {
    const played = playRandomGame(configFor(7))
    const frames = replayFrames(played.record)
    expect(frames).toHaveLength(played.record.moves.length + 1)
    expect(frames[0].state.turn).toBe(0)
  })
})

describe('the hash is sensitive to every field that can diverge', () => {
  it('changes when a single orb differs', () => {
    const played = playRandomGame(configFor(3))
    const mutated = replay({ config: played.record.config, moves: played.record.moves.slice(0, -1) })
    expect(hashState(mutated)).not.toBe(hashState(played.final))
  })

  it('changes when the player to move differs', () => {
    const played = playRandomGame(configFor(5))
    const shifted = { ...played.final, current: (played.final.current + 1) % played.final.players }
    expect(hashState(shifted)).not.toBe(hashState(played.final))
  })
})
