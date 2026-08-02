import type { PlayerId } from './board'

/**
 * The cascade emits an ordered event stream. The renderer replays it; it never
 * decides what happened, only how to draw it (PRD §6).
 *
 * Discriminated on `type` so an exhaustive switch with a `never` default makes
 * a new event surface in every consumer that must handle it.
 */

export type PlaceEvent = {
  readonly type: 'place'
  readonly index: number
  readonly player: PlayerId
  readonly count: number
}

export type ExplodeEvent = {
  readonly type: 'explode'
  readonly index: number
  readonly player: PlayerId
  /** Cascade generation, 0 for the first wave. Animation groups on this. */
  readonly step: number
}

export type ConvertEvent = {
  readonly type: 'convert'
  readonly index: number
  readonly from: PlayerId | null
  readonly to: PlayerId
  readonly count: number
  readonly step: number
}

export type EliminateEvent = {
  readonly type: 'eliminate'
  readonly player: PlayerId
}

export type WinEvent = {
  readonly type: 'win'
  readonly player: PlayerId
}

export type GameEvent = PlaceEvent | ExplodeEvent | ConvertEvent | EliminateEvent | WinEvent

export function isExplosionEvent(event: GameEvent): event is ExplodeEvent | ConvertEvent {
  return event.type === 'explode' || event.type === 'convert'
}

/** Longest cascade triggered — the stat worth bragging about (PRD §9.5). */
export function countExplosions(events: readonly GameEvent[]): number {
  let total = 0
  for (const event of events) if (event.type === 'explode') total += 1
  return total
}

/** Number of cascade generations, for animation pacing. */
export function cascadeDepth(events: readonly GameEvent[]): number {
  let depth = 0
  for (const event of events) {
    if (isExplosionEvent(event)) depth = Math.max(depth, event.step + 1)
  }
  return depth
}

export function describeEvent(event: GameEvent): string {
  switch (event.type) {
    case 'place':
      return `place p${event.player} @${event.index} -> ${event.count}`
    case 'explode':
      return `explode p${event.player} @${event.index} step ${event.step}`
    case 'convert':
      return `convert @${event.index} ${event.from ?? '-'} -> p${event.to} = ${event.count}`
    case 'eliminate':
      return `eliminate p${event.player}`
    case 'win':
      return `win p${event.player}`
    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}
