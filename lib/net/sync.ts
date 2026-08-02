/**
 * The wire protocol.
 *
 * Only moves and hashes cross it — never state. Sending state hides desync
 * instead of exposing it, and there is no authority here to trust: both
 * browsers apply the same moves through the same pure function.
 *
 * Nothing in this module knows the rules. If transport ever needs to know them,
 * the design is wrong (PRD §10).
 */
export type NetMessage =
  | {
      readonly t: 'hello'
      readonly rows: number
      readonly cols: number
      readonly seed: number
      /** Move list, so a rejoining peer can rebuild the position by replay. */
      readonly moves: readonly number[]
    }
  | {
      readonly t: 'move'
      /** Turn number *after* the move, paired with the hash of that position. */
      readonly turn: number
      readonly index: number
      readonly hash: string
    }
  | {
      readonly t: 'desync'
      readonly turn: number
      readonly hash: string
    }
  | {
      readonly t: 'resync'
      readonly moves: readonly number[]
    }
  | { readonly t: 'bye' }

export function encodeMessage(message: NetMessage): string {
  return JSON.stringify(message)
}

export function decodeMessage(raw: string): NetMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as NetMessage
    switch (candidate.t) {
      case 'hello':
      case 'move':
      case 'desync':
      case 'resync':
      case 'bye':
        return candidate
      default:
        return null
    }
  } catch {
    return null
  }
}

export type SyncVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'hash' | 'turn'; readonly expected: string; readonly received: string }

/**
 * Compare our position against the peer's claim for the same turn.
 *
 * A mismatch is never reconciled by trusting one side. Both peers stop and are
 * told, because two players unknowingly playing different games is the worst
 * outcome this project can produce.
 */
export function verify(
  localTurn: number,
  localHash: string,
  claimedTurn: number,
  claimedHash: string,
): SyncVerdict {
  if (localTurn !== claimedTurn) {
    return {
      ok: false,
      reason: 'turn',
      expected: String(localTurn),
      received: String(claimedTurn),
    }
  }
  if (localHash !== claimedHash) {
    return { ok: false, reason: 'hash', expected: localHash, received: claimedHash }
  }
  return { ok: true }
}
