import { applyMove } from '@/lib/engine/apply'
import { nextInt, normaliseSeed, type Seed } from '@/lib/engine/prng'
import type { GameRecord } from '@/lib/engine/replay'
import { createGame, legalMoves, type GameConfig, type GameState } from '@/lib/engine/state'

/**
 * Random legal games, driven by the same seeded PRNG the engine uses. The
 * corpus is reproducible: a failure at seed N is a failure anyone can rerun.
 */

/** A game that has not ended by here is a bug, not a slow game. */
export const TURN_CAP = 5000

export type PlayedGame = {
  readonly record: GameRecord
  readonly final: GameState
  readonly turns: number
}

export function playRandomGame(config: GameConfig): PlayedGame {
  let state = createGame(config)
  let seed: Seed = normaliseSeed(config.seed ^ 0x5bf03635)
  const moves: number[] = []

  while (state.winner === null) {
    const options = legalMoves(state)
    if (options.length === 0) throw new Error('no legal moves but no winner')

    const draw = nextInt(seed, options.length)
    seed = draw.seed
    const index = options[draw.value]

    moves.push(index)
    state = applyMove(state, { type: 'place', player: state.current, index }).state

    if (moves.length > TURN_CAP) throw new Error(`game exceeded ${TURN_CAP} turns`)
  }

  return { record: { config, moves }, final: state, turns: moves.length }
}

/** A spread of board sizes and player counts, derived from the corpus index. */
export function configFor(index: number): GameConfig {
  const sizes = [
    [3, 3],
    [4, 5],
    [5, 6],
    [6, 9],
    [7, 4],
  ] as const
  const size = sizes[index % sizes.length]
  return {
    rows: size[0],
    cols: size[1],
    players: 2 + (index % 3),
    seed: normaliseSeed(index * 2654435761 + 1),
  }
}
