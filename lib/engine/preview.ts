import { applyMove } from './apply'
import { NO_OWNER } from './board'
import { isLegalMove, type GameState } from './state'

/**
 * What a move would do, without committing to it (PRD §9.2).
 *
 * This is the teaching aid: a new player cannot see that placing one orb in a
 * corner will sweep a third of the board until they have watched it happen a
 * few times. It is also a genuine strategic tool.
 *
 * It answers by running the real move through the real engine on a throwaway
 * state — never by a second, approximate implementation of the rules. If the
 * preview and the outcome could ever disagree, the preview would be a lie.
 */
export type MovePreview = {
  /** 1 where the cell changes at all. Positional flags, not a Set. */
  readonly touched: Uint8Array
  /** 1 where the cell ends up belonging to the mover but did not before. */
  readonly captured: Uint8Array
  readonly explosions: number
  readonly capturedCount: number
  readonly wins: boolean
}

export function previewMove(state: GameState, index: number): MovePreview | null {
  const move = { type: 'place', player: state.current, index } as const
  if (!isLegalMove(state, move)) return null

  const before = state.board
  const { state: after, events } = applyMove(state, move)

  const size = before.owners.length
  const touched = new Uint8Array(size)
  const captured = new Uint8Array(size)
  let capturedCount = 0

  for (let cell = 0; cell < size; cell += 1) {
    const ownerChanged = before.owners[cell] !== after.board.owners[cell]
    const countChanged = before.counts[cell] !== after.board.counts[cell]
    if (ownerChanged || countChanged) touched[cell] = 1

    const wasTheirs = before.owners[cell] !== state.current && before.owners[cell] !== NO_OWNER
    if (wasTheirs && after.board.owners[cell] === state.current) {
      captured[cell] = 1
      capturedCount += 1
    }
  }

  let explosions = 0
  for (const event of events) if (event.type === 'explode') explosions += 1

  return {
    touched,
    captured,
    explosions,
    capturedCount,
    wins: after.winner === state.current,
  }
}
