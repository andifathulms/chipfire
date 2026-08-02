/**
 * Seeded PRNG carried inside the state. The engine itself needs no randomness,
 * but any that ever appears (AI noise, generated fixtures) must come from here
 * so a game stays reproducible from its seed alone.
 *
 * xorshift32: integer only, no floats, identical on every JS engine.
 */

export type Seed = number

export function normaliseSeed(seed: number): Seed {
  const value = seed >>> 0
  // Zero is a fixed point of xorshift and would freeze the stream.
  return value === 0 ? 0x9e3779b9 : value
}

/** Advance the stream; returns the next state and a 32-bit unsigned value. */
export function nextSeed(seed: Seed): { seed: Seed; value: number } {
  let x = seed >>> 0
  x ^= x << 13
  x >>>= 0
  x ^= x >>> 17
  x ^= x << 5
  x >>>= 0
  const next = normaliseSeed(x)
  return { seed: next, value: next }
}

/** Uniform integer in [0, bound). Rejection-free modulo is fine at this scale. */
export function nextInt(seed: Seed, bound: number): { seed: Seed; value: number } {
  if (bound <= 0) throw new Error('bound must be positive')
  const step = nextSeed(seed)
  return { seed: step.seed, value: step.value % bound }
}

/** Seed from a string, so a shared code reproduces a game exactly. */
export function seedFromString(text: string): Seed {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return normaliseSeed(hash)
}
