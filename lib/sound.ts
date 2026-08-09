/**
 * Sound, synthesised — no audio files anywhere.
 *
 * Every tone here is a few oscillator cycles built at runtime through the Web
 * Audio API, which is a browser built-in rather than a dependency. That keeps
 * the static export exactly as it was: nothing extra to fetch, nothing to
 * cache-bust, no asset pipeline, and no bytes for a player who never turns it
 * on. It also suits the material: PRD §12 asks for an instrument panel rather
 * than an arcade, and short pitched blips are what an instrument does.
 *
 * ── The one idea worth having ─────────────────────────────────────────────
 *
 * Sound is a second renderer of the event stream, not a layer of effects
 * bolted beside it. Animation replays what the engine decided and never
 * decides anything itself (invariant 15); this obeys the same rule, off the
 * same frames. One tone per cascade *generation* — not per explosion — and the
 * pitch climbs a step with each one, so a forty-cell chain is an audible rising
 * figure and a two-cell one is a short blip. You can hear how deep a cascade
 * went with your eyes shut.
 *
 * ── What it is not ────────────────────────────────────────────────────────
 *
 * Off by default, and not because of taste: a page that makes noise before
 * being asked is a page people close. The engine imports none of this, nothing
 * here is hashed or sent, and no game state depends on whether it is on.
 */
const STORAGE_KEY = 'chipfire.sound.v1'

/** Quiet. This is feedback, not a soundtrack. */
const VOLUME = 0.05

/**
 * Semitones above the base note, per cascade generation, capped at two octaves.
 *
 * Capped rather than allowed to run: a 40-generation chain would otherwise
 * climb past hearing and end in silence, which reads as the sound breaking
 * rather than as a long cascade. Pure, and the only part of this file worth
 * testing.
 */
export const BASE_FREQUENCY = 261.63 // middle C
const MAX_STEPS = 24

export function toneFor(generation: number): number {
  const step = Math.max(0, Math.min(MAX_STEPS, Math.floor(generation)))
  return BASE_FREQUENCY * Math.pow(2, step / 12)
}

type Ctor = typeof AudioContext

function audioConstructor(): Ctor | null {
  if (typeof window === 'undefined') return null
  const legacy = (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
  return window.AudioContext ?? legacy ?? null
}

let context: AudioContext | null = null
let enabled = false

/**
 * Created on the first sound, which is always downstream of a click — browsers
 * refuse to start audio without a gesture, and a context built at import time
 * would be born suspended and stay that way.
 */
function ensureContext(): AudioContext | null {
  if (context !== null) return context
  const Ctor = audioConstructor()
  if (Ctor === null) return null
  try {
    context = new Ctor()
    return context
  } catch {
    // Audio unavailable. The game is not.
    return null
  }
}

export function soundSupported(): boolean {
  return audioConstructor() !== null
}

export function readSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    enabled = false
  }
  return enabled
}

export function setSoundEnabled(next: boolean): void {
  enabled = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
  } catch {
    // Storage unavailable; the setting simply does not survive a reload.
  }
  // Warm the context on the click that switched it on, so the first tone is
  // not swallowed by a context that is still starting.
  if (next) void ensureContext()?.resume()
}

export function isSoundEnabled(): boolean {
  return enabled
}

type ToneOptions = {
  readonly frequency: number
  readonly durationMs: number
  readonly type?: OscillatorType
  readonly gain?: number
  /** Seconds from now, for figures of more than one note. */
  readonly delay?: number
}

/**
 * One note. Attack and release are ramps rather than switches, because an
 * abruptly gated oscillator clicks, and forty clicks in a row is a fault sound.
 */
function tone({ frequency, durationMs, type = 'triangle', gain = 1, delay = 0 }: ToneOptions): void {
  if (!enabled) return
  const ctx = ensureContext()
  if (ctx === null) return
  if (ctx.state === 'suspended') void ctx.resume()

  const at = ctx.currentTime + delay
  const seconds = durationMs / 1000
  const peak = VOLUME * gain

  const osc = ctx.createOscillator()
  const envelope = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, at)

  envelope.gain.setValueAtTime(0, at)
  envelope.gain.linearRampToValueAtTime(peak, at + 0.005)
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + seconds)

  osc.connect(envelope).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + seconds + 0.02)
}

/** An orb landing. The quietest thing here — it happens every single turn. */
export function playPlace(): void {
  tone({ frequency: BASE_FREQUENCY / 2, durationMs: 70, type: 'sine', gain: 0.7 })
}

/** One cascade generation. Pitch climbs with depth; that is the whole feature. */
export function playGeneration(generation: number): void {
  tone({ frequency: toneFor(generation), durationMs: 110, type: 'triangle' })
}

/** The game ending. The only figure of more than one note in the app. */
export function playWin(): void {
  tone({ frequency: BASE_FREQUENCY, durationMs: 160, type: 'sine' })
  tone({ frequency: BASE_FREQUENCY * 1.5, durationMs: 260, type: 'sine', delay: 0.13 })
}
