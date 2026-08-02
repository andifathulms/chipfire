import { describe, expect, it } from 'vitest'
import { decodeRecord, encodeRecord, RecordCodeError } from '@/lib/share'
import { hashState } from '@/lib/engine/hash'
import { replay } from '@/lib/engine/replay'
import { configFor, playRandomGame } from '../random'

describe('game codes', () => {
  it('round-trips a played game and replays to the same position', () => {
    for (let index = 0; index < 60; index += 1) {
      const played = playRandomGame(configFor(index))
      const decoded = decodeRecord(encodeRecord(played.record))

      expect(decoded.moves).toEqual(played.record.moves)
      expect(hashState(replay(decoded))).toBe(hashState(played.final))
    }
  })

  it('stays short enough to paste', () => {
    const played = playRandomGame(configFor(3))
    // One byte per move plus an eight-byte header, before base64 expansion.
    expect(encodeRecord(played.record).length).toBeLessThan(played.record.moves.length * 2 + 24)
  })

  it('rejects a corrupt code instead of replaying nonsense', () => {
    expect(() => decodeRecord('!!!!')).toThrow(RecordCodeError)
    expect(() => decodeRecord('')).toThrow(RecordCodeError)
  })

  it('rejects a move that falls outside the board it declares', () => {
    const played = playRandomGame(configFor(0)) // 3x3
    const code = encodeRecord({ config: played.record.config, moves: [200] })
    expect(() => decodeRecord(code)).toThrow(/luar papan/)
  })

  it('rejects a board size the engine would refuse anyway', () => {
    const code = encodeRecord({
      config: { rows: 2, cols: 2, players: 2, seed: 1 },
      moves: [],
    })
    expect(() => decodeRecord(code)).toThrow(/papan/)
  })
})
