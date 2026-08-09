'use client'

import { useCallback, useEffect, useState } from 'react'
import { SPEEDS, useReducedMotion, type Speed } from './useCascadePlayer'
import type { Frame } from './frames'

/**
 * Re-watching a cascade that has already resolved.
 *
 * The chain is the product — every other part of the game exists to set one up
 * — and it was the only thing in the app that happened exactly once and could
 * not be recovered. Forty explosions run past at whatever speed was set, the
 * board is unrecognisable, and a player knows they won the exchange without
 * ever seeing how.
 *
 * This is a separate clock from useCascadePlayer on purpose. That one plays a
 * cascade as it happens, forward only, and hands control back when it ends —
 * it is part of taking a turn. This is stepping through a recording, and mixing
 * the two would have put a rewind inside the thing that advances the game.
 *
 * Nothing here recomputes anything. The frames were built from the engine's
 * event stream when the move was played; this walks that array (invariant 15).
 */
export type CascadeReview = {
  readonly open: boolean
  readonly frame: Frame | null
  readonly index: number
  readonly total: number
  readonly playing: boolean
  readonly canStepBack: boolean
  readonly canStepOn: boolean
  start: () => void
  stop: () => void
  toggle: () => void
  step: (delta: number) => void
}

export function useCascadeReview(frames: readonly Frame[], speed: Speed): CascadeReview {
  // null is closed. Any other value is the frame being looked at.
  const [index, setIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const reduced = useReducedMotion()

  const total = frames.length
  const open = index !== null && total > 0

  // A new cascade replaces the one under review; nothing about the old one is
  // still on screen to be confused about.
  useEffect(() => {
    setIndex(null)
    setPlaying(false)
  }, [frames])

  const stop = useCallback(() => {
    setIndex(null)
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    if (frames.length === 0) return
    setIndex(0)
    /*
     * Reduced motion opens paused rather than not opening at all. Someone who
     * has asked for less movement still gets the most legible view of a chain
     * this app can offer — one generation at a time, at their own pace — which
     * is strictly better than the animation they opted out of.
     */
    setPlaying(!reduced)
  }, [frames.length, reduced])

  const step = useCallback(
    (delta: number) => {
      setPlaying(false)
      setIndex((current) => {
        if (current === null) return current
        const next = current + delta
        if (next < 0 || next >= total) return current
        return next
      })
    },
    [total],
  )

  const toggle = useCallback(() => {
    if (index === null) return
    // Pressing play at the end starts it over rather than doing nothing.
    if (!playing && index >= total - 1) setIndex(0)
    setPlaying((value) => !value)
  }, [index, playing, total])

  useEffect(() => {
    if (!playing || index === null) return undefined

    if (index >= total - 1) {
      setPlaying(false)
      return undefined
    }

    const interval = SPEEDS[speed] || SPEEDS.normal
    const timer = window.setTimeout(() => setIndex((current) => (current ?? 0) + 1), interval)
    return () => window.clearTimeout(timer)
  }, [playing, index, total, speed])

  return {
    open,
    frame: open ? (frames[Math.min(index, total - 1)] ?? null) : null,
    index: index ?? 0,
    total,
    playing,
    canStepBack: open && index > 0,
    canStepOn: open && index < total - 1,
    start,
    stop,
    toggle,
    step,
  }
}
