import { describe, expect, it } from 'vitest'
import { summariseMoves, replayFrames, type GameRecord } from '@/lib/engine/replay'
import { countExplosions } from '@/lib/engine/events'
import { DEFAULT_CONFIG, type GameConfig } from '@/lib/engine/state'
import { playRandomGame } from '../random'

const SMALL: GameConfig = { ...DEFAULT_CONFIG, rows: 3, cols: 3, players: 2, seed: 3 }

describe('summarising a move list', () => {
  it('reports one line per move', () => {
    const record: GameRecord = { config: SMALL, moves: [0, 8, 1] }
    expect(summariseMoves(record)).toHaveLength(3)
  })

  it('says nothing happened when nothing happened', () => {
    // Three opening placements on a 3x3, none of them reaching critical mass.
    const record: GameRecord = { config: SMALL, moves: [4, 8, 2] }
    const summary = summariseMoves(record)
    expect(summary.every((move) => move.explosions === 0)).toBe(true)
    expect(summary.every((move) => move.captures === 0)).toBe(true)
  })

  it('counts the chain, not just the cell that was played', () => {
    /*
     * Player A takes a corner to critical mass. A corner's mass is 2, so the
     * second orb fires it into its two neighbours — one explosion, and both
     * neighbours were empty so both are captures.
     */
    const record: GameRecord = { config: SMALL, moves: [0, 8, 0] }
    const summary = summariseMoves(record)
    expect(summary[2]).toEqual({ index: 0, player: 0, explosions: 1, captures: 2 })
  })

  it('attributes each move to the player who actually made it', () => {
    const record: GameRecord = { config: SMALL, moves: [0, 8, 1, 7] }
    expect(summariseMoves(record).map((move) => move.player)).toEqual([0, 1, 0, 1])
  })

  it('agrees with the event stream across whole games', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const game = playRandomGame({ rows: 5, cols: 6, players: 2, seed })
      const summary = summariseMoves(game.record)
      const frames = replayFrames(game.record)

      expect(summary).toHaveLength(game.record.moves.length)
      summary.forEach((move, position) => {
        expect(move.explosions).toBe(countExplosions(frames[position + 1].events))
        expect(move.index).toBe(game.record.moves[position])
      })
    }
  })

  it('is a pure function of the record, so undo needs no bookkeeping', () => {
    const game = playRandomGame({ rows: 5, cols: 6, players: 2, seed: 11 })
    const full = summariseMoves(game.record)
    const shortened = summariseMoves({
      config: game.record.config,
      moves: game.record.moves.slice(0, -3),
    })

    // Dropping the last three moves must leave the earlier lines untouched —
    // if it did not, the summary would be remembering something the move list
    // does not say.
    expect(shortened).toEqual(full.slice(0, -3))
  })
})
