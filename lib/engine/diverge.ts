import { hashState } from './hash'
import { replayFrames, type GameRecord } from './replay'
import type { GameConfig } from './state'

/**
 * Where two peers stopped playing the same game.
 *
 * Desync detection already works: hashes are exchanged every turn and both
 * sides halt on mismatch, which is the part that matters (PRD §7). What halting
 * does not do is say *where*, and without that the two players are looking at a
 * dead end with no way to tell a dropped message from an engine bug — the first
 * being ordinary and the second being the worst thing this project could ship.
 *
 * The same property that detects divergence localises it: a game is its move
 * list, so replaying two lists side by side finds the first turn they stop
 * agreeing, with no authority deciding which one is right. Neither is assumed
 * correct here, and this function never proposes a winner.
 *
 * This is rules logic, not transport — it replays and it hashes — so it lives in
 * the engine. `lib/net` stays a pipe that knows nothing about the game
 * (invariant 10).
 */
export type Divergence =
  /** Same moves, and nothing contradicts them. */
  | { readonly kind: 'identical' }
  /**
   * One list is a strict prefix of the other. Almost always benign: a move in
   * flight, or one side halted a turn earlier than the other.
   */
  | {
      readonly kind: 'behind'
      /** The turn after the last one both sides share. */
      readonly turn: number
      readonly shorter: 'mine' | 'theirs'
    }
  /**
   * The lists disagree about what was played. This is the ordinary cause — a
   * message dropped, duplicated, or applied out of order.
   */
  | {
      readonly kind: 'moves'
      readonly turn: number
      readonly mine: number
      readonly theirs: number
    }
  /**
   * The lists agree move for move and the peer still reported a different hash
   * for a position. The move list cannot explain this, which means one of the
   * two engines computed a different result from identical input.
   *
   * That is a determinism bug and must be reported as one, never smoothed over
   * by resyncing — a resync would hide the only evidence that it happened.
   */
  | { readonly kind: 'engine'; readonly turn: number }

/** What the peer told us about a position, straight off the wire. */
export type ReportedHash = {
  readonly turn: number
  readonly hash: string
}

/**
 * Our own hash after `turn` moves, or null if we never got that far.
 * Turn 0 is the opening position, before anyone has played.
 */
export function hashAtTurn(record: GameRecord, turn: number): string | null {
  if (turn < 0 || turn > record.moves.length) return null
  const frames = replayFrames({ config: record.config, moves: record.moves.slice(0, turn) })
  const frame = frames[frames.length - 1]
  return frame === undefined ? null : hashState(frame.state)
}

export function findDivergence(
  config: GameConfig,
  mine: readonly number[],
  theirs: readonly number[],
  /** The hash the peer sent for a turn, if we have one. */
  reported: ReportedHash | null = null,
): Divergence {
  /*
   * Moves first, and only then hashes. A differing move explains a differing
   * hash completely, so reporting the hash as well would be reporting the
   * symptom alongside the cause as though they were two findings.
   */
  const shared = Math.min(mine.length, theirs.length)
  for (let move = 0; move < shared; move += 1) {
    if (mine[move] !== theirs[move]) {
      // Turns are 1-based for a player: the first move produces turn 1.
      return { kind: 'moves', turn: move + 1, mine: mine[move], theirs: theirs[move] }
    }
  }

  if (mine.length !== theirs.length) {
    return {
      kind: 'behind',
      turn: shared + 1,
      shorter: mine.length < theirs.length ? 'mine' : 'theirs',
    }
  }

  /*
   * The lists are identical, so replaying theirs here would only reproduce our
   * own result — our engine cannot disagree with itself. The only evidence that
   * *their* engine differs is the hash they sent, which is why it has to be
   * passed in rather than recomputed.
   */
  if (reported !== null) {
    const ours = hashAtTurn({ config, moves: mine }, reported.turn)
    if (ours !== null && ours !== reported.hash) {
      return { kind: 'engine', turn: reported.turn }
    }
  }

  return { kind: 'identical' }
}
