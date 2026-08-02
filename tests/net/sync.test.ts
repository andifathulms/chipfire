import { describe, expect, it } from 'vitest'
import { decodeMessage, encodeMessage, verify } from '@/lib/net/sync'
import { applyMove } from '@/lib/engine/apply'
import { hashState } from '@/lib/engine/hash'
import { createGame } from '@/lib/engine/state'
import { toMove } from '@/lib/engine/replay'
import { configFor, playRandomGame } from '../random'

describe('the wire protocol', () => {
  it('round-trips the messages it defines', () => {
    const message = { t: 'move', turn: 4, index: 17, hash: 'deadbeef' } as const
    expect(decodeMessage(encodeMessage(message))).toEqual(message)
  })

  it('drops anything it does not recognise instead of trusting it', () => {
    expect(decodeMessage('not json')).toBeNull()
    expect(decodeMessage('{"t":"exec","cmd":"rm"}')).toBeNull()
    expect(decodeMessage('null')).toBeNull()
  })

  it('carries only moves and hashes — never a board', () => {
    const played = playRandomGame(configFor(2))
    const wire = encodeMessage({ t: 'hello', rows: 6, cols: 9, seed: 1, moves: played.record.moves })

    expect(wire).not.toMatch(/owners|counts|orbs/)
  })
})

describe('desync detection', () => {
  it('agrees when both peers replayed the same moves', () => {
    const played = playRandomGame(configFor(4))
    let state = createGame(played.record.config)

    for (const index of played.record.moves) {
      state = applyMove(state, toMove(state, index)).state
      expect(verify(state.turn, hashState(state), state.turn, hashState(state))).toEqual({
        ok: true,
      })
    }
  })

  it('halts on a hash mismatch rather than reconciling', () => {
    const verdict = verify(7, 'aaaaaaaa', 7, 'bbbbbbbb')
    expect(verdict.ok).toBe(false)
    expect(verdict).toMatchObject({ reason: 'hash', expected: 'aaaaaaaa', received: 'bbbbbbbb' })
  })

  it('halts when the peers are not even on the same turn', () => {
    expect(verify(7, 'aaaaaaaa', 8, 'aaaaaaaa')).toMatchObject({ reason: 'turn' })
  })

  it('catches a peer that applied a different move at the same turn', () => {
    const config = configFor(6)
    const base = createGame(config)

    const mine = applyMove(base, toMove(base, 0)).state
    const theirs = applyMove(base, toMove(base, 1)).state

    expect(verify(mine.turn, hashState(mine), theirs.turn, hashState(theirs)).ok).toBe(false)
  })
})
