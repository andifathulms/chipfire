import { describe, expect, it } from 'vitest'
import { findDivergence, hashAtTurn } from '@/lib/engine/diverge'
import { replayHashes } from '@/lib/engine/replay'
import { DEFAULT_CONFIG, type GameConfig } from '@/lib/engine/state'
import { playRandomGame } from '../random'

const CONFIG: GameConfig = { ...DEFAULT_CONFIG, rows: 5, cols: 6, players: 2, seed: 7 }

/**
 * Deliberately divergent move lists. The desync branch is exercised almost
 * never in real play, which is exactly why it needs fixtures — an untested
 * recovery path rots silently and is discovered at the worst moment.
 */
describe('finding where two peers stopped playing the same game', () => {
  const game = playRandomGame(CONFIG)
  const moves = game.record.moves

  it('says nothing is wrong when nothing is wrong', () => {
    expect(findDivergence(CONFIG, moves, moves)).toEqual({ kind: 'identical' })
  })

  it('names the first turn whose move differs, not the first that looks odd', () => {
    const theirs = [...moves]
    // Two changes. The report must point at the earlier one: the second is
    // downstream of a board that already stopped matching.
    theirs[4] = moves[5]
    theirs[9] = moves[10]

    const found = findDivergence(CONFIG, moves, theirs)
    expect(found).toEqual({
      kind: 'moves',
      turn: 5,
      mine: moves[4],
      theirs: moves[5],
    })
  })

  it('reports a shorter list as behind rather than as a disagreement', () => {
    const theirs = moves.slice(0, 6)
    expect(findDivergence(CONFIG, moves, theirs)).toEqual({
      kind: 'behind',
      turn: 7,
      shorter: 'theirs',
    })
  })

  it('knows which side is behind', () => {
    const mine = moves.slice(0, 3)
    expect(findDivergence(CONFIG, mine, moves)).toEqual({
      kind: 'behind',
      turn: 4,
      shorter: 'mine',
    })
  })

  it('prefers the differing move over the differing hash', () => {
    const theirs = [...moves]
    theirs[2] = moves[3]

    // A hash that disagrees too — which it would, downstream of a different
    // move. The move is the cause and is the only thing worth reporting.
    const found = findDivergence(CONFIG, moves, theirs, { turn: 8, hash: 'deadbeef' })
    expect(found.kind).toBe('moves')
    expect(found).toMatchObject({ turn: 3 })
  })
})

describe('the case that means a bug rather than a dropped message', () => {
  const game = playRandomGame(CONFIG)
  const moves = game.record.moves

  it('calls it an engine divergence when the lists agree and the hash does not', () => {
    const found = findDivergence(CONFIG, moves, moves, { turn: 6, hash: 'not-our-hash' })
    expect(found).toEqual({ kind: 'engine', turn: 6 })
  })

  it('does not cry bug when the peer hash is simply correct', () => {
    const hashes = replayHashes({ config: CONFIG, moves })
    // replayHashes[0] is the opening position, so turn N is at index N.
    const found = findDivergence(CONFIG, moves, moves, { turn: 6, hash: hashes[6] })
    expect(found).toEqual({ kind: 'identical' })
  })

  it('stays quiet about a turn it has no opinion on', () => {
    // A hash for a turn beyond our own move list is not evidence of anything.
    const found = findDivergence(CONFIG, moves, moves, {
      turn: moves.length + 5,
      hash: 'whatever',
    })
    expect(found).toEqual({ kind: 'identical' })
  })
})

describe('hashAtTurn', () => {
  const game = playRandomGame(CONFIG)
  const record = game.record

  it('agrees with a full replay at every turn', () => {
    const hashes = replayHashes(record)
    for (let turn = 0; turn <= record.moves.length; turn += 1) {
      expect(hashAtTurn(record, turn)).toBe(hashes[turn])
    }
  })

  it('has no opinion outside the game it was given', () => {
    expect(hashAtTurn(record, -1)).toBeNull()
    expect(hashAtTurn(record, record.moves.length + 1)).toBeNull()
  })
})
