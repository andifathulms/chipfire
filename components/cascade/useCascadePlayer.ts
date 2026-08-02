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

  useEffect(() => {
    if (frames.length === 0) return undefined

    if (interval === 0 || index >= frames.length - 1) {
      const timer = window.setTimeout(() => doneRef.current(), interval === 0 ? 0 : interval)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => setIndex((value) => value + 1), interval)
    return () => window.clearTimeout(timer)
  }, [frames, index, interval])

  const resolved = interval === 0 ? frames.length - 1 : index

  return {
    frame: frames.length === 0 ? null : (frames[Math.min(resolved, frames.length - 1)] ?? null),
    playing: frames.length > 0,
    index: resolved,
    total: frames.length,
    skip: () => setIndex(Math.max(0, frames.length - 1)),
  }
}
