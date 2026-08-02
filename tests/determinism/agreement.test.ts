import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { hashState } from '@/lib/engine/hash'
import { createGame } from '@/lib/engine/state'
import { toMove } from '@/lib/engine/replay'
import { configFor, playRandomGame } from '../random'

/**
 * Cross-instance agreement: two independent engine instances fed the same move
 * list must agree on the hash at *every* turn, not merely at the end.
 *
 * This is the peer-to-peer sync guarantee, tested with no networking involved.
 * A mid-game divergence that resolves by the final position would still stop a
 * real game dead, so per-turn equality is the assertion that matters.
 */
const CORPUS = 200

function hashesFor(record: ReturnType<typeof playRandomGame>['record']): string[] {
  let state = createGame(record.config)
  const out = [hashState(state)]
  for (const index of record.moves) {
    state = applyMove(state, toMove(state, index)).state
    out.push(hashState(state))
  }
  return out
}

describe('two engine instances agree on every turn', () => {
  it('matches hash for hash across the corpus', () => {
    for (let index = 0; index < CORPUS; index += 1) {
      const played = playRandomGame(configFor(index))

      const peerA = hashesFor(played.record)
      const peerB = hashesFor(played.record)

      expect(peerB).toEqual(peerA)
      expect(peerA.at(-1)).toBe(hashState(played.final))
    }
  })

  it('emits an identical event stream on both instances', () => {
    const played = playRandomGame(configFor(11))

    const streamFor = () => {
      let state = createGame(played.record.config)
      return played.record.moves.map((index) => {
        const result = applyMove(state, toMove(state, index))
        state = result.state
        return result.events
      })
    }

    expect(streamFor()).toEqual(streamFor())
  })

  it('detects divergence rather than hiding it', () => {
    const played = playRandomGame(configFor(13))
    const truncated = { config: played.record.config, moves: played.record.moves.slice(0, -1) }

    expect(hashesFor(truncated).at(-1)).not.toBe(hashesFor(played.record).at(-1))
  })
})
