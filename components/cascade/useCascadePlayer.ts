'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Frame } from './frames'

/**
 * Plays a frame list on a clock. The clock lives here and only here — never in
 * the engine, which is why the animation can be sped up, slowed down, or
 * skipped entirely without touching the game.
 *
 * A 40-step cascade at full animation is slow; at no animation it is
 * incomprehensible. Hence the speed control (PRD §9.1).
 */
export const SPEEDS = {
  pelan: 220,
  normal: 120,
  cepat: 55,
  langsung: 0,
} as const

export type Speed = keyof typeof SPEEDS

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type CascadePlayer = {
  readonly frame: Frame | null
  readonly playing: boolean
  readonly index: number
  readonly total: number
  skip: () => void
}

export function useCascadePlayer(
  frames: readonly Frame[],
  speed: Speed,
  onDone: () => void,
  /**
   * How long to hold the opening frame, as a multiple of the interval. That
   * frame shows the orb landing before anything detonates, which is the whole
   * message when the move was not yours — you need to see *where* they played
   * before the chain runs away from it. On your own move you already know, so
   * the default stays short.
   */
  placementHold = 1.6,
): CascadePlayer {
  const [index, setIndex] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const interval = useMemo(() => {
    // Reduced motion resolves instantly and the outcome is reported in the HUD.
    if (prefersReducedMotion()) return 0
    return SPEEDS[speed]
  }, [speed])

  useEffect(() => {
    setIndex(0)
  }, [frames])

  /*
   * The chain gets a rhythm rather than a metronome (PRD §12).
   *
   * Two frames are not like the others. The first is the orb you placed — a
   * beat of its own, before anything has gone off — and the last is the
   * resolved position, which wants a moment to land before the HUD moves under
   * it. Everything between them is the cascade proper and runs at tempo.
   *
   * This only stretches time. It never reorders or drops a frame, so what is
   * drawn is still exactly the engine's event stream, in the engine's order.
   */
  useEffect(() => {
    if (frames.length === 0) return undefined

    const last = index >= frames.length - 1
    const delay =
      interval === 0
        ? 0
        : index === 0
          ? Math.round(interval * placementHold)
          : last
            ? Math.round(interval * 1.4)
            : interval

    if (interval === 0 || last) {
      const timer = window.setTimeout(() => doneRef.current(), delay)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => setIndex((value) => value + 1), delay)
    return () => window.clearTimeout(timer)
  }, [frames, index, interval, placementHold])

  const resolved = interval === 0 ? frames.length - 1 : index

  return {
    frame: frames.length === 0 ? null : (frames[Math.min(resolved, frames.length - 1)] ?? null),
    playing: frames.length > 0,
    index: resolved,
    total: frames.length,
    skip: () => setIndex(Math.max(0, frames.length - 1)),
  }
}
