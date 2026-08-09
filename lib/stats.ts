/**
 * Local stats only — localStorage, no server, no leaderboard (PRD §9.5).
 * Everything here is best-effort: storage can be full, disabled, or private,
 * and none of that is worth interrupting a game over.
 */
const KEY = 'chipfire.stats.v2'

/** The shape before avalanche buckets existed. Read once, then written forward. */
const V1_KEY = 'chipfire.stats.v1'

/**
 * The name this shipped under before the rebrand. Read once, on the first load
 * after the rename, so nobody who has been playing loses their record to a
 * decision that had nothing to do with them. Safe to delete once enough time
 * has passed that no returning player still holds the old key.
 */
const LEGACY_KEY = 'rantai.stats.v1'

export type Mode = 'hotseat' | 'ai' | 'p2p'

/**
 * Avalanche sizes, bucketed.
 *
 * This game is the abelian sandpile with capture on top, and the thing that
 * model is famous for is the shape of its avalanches: overwhelmingly small,
 * rarely enormous, with no typical size in between. The app has been recording
 * one scalar — the single longest chain ever triggered — which is the least
 * informative summary of a distribution it is possible to keep.
 *
 * Buckets double, because a distribution with a long tail is unreadable on a
 * linear axis: 1, 2, 3–4, 5–8, and so on. Explicit thresholds rather than a
 * logarithm, so this stays integer arithmetic and the boundaries are something
 * you can read rather than derive.
 */
export const AVALANCHE_BUCKETS = 8

export const AVALANCHE_RANGES: readonly (readonly [number, number])[] = [
  [1, 1],
  [2, 2],
  [3, 4],
  [5, 8],
  [9, 16],
  [17, 32],
  [33, 64],
  // The tail bucket is open-ended; 0 means "no upper bound".
  [65, 0],
]

/** Which bucket an avalanche of `explosions` cells falls in, or -1 for none. */
export function avalancheBucket(explosions: number): number {
  // A move that set nothing off is not a small avalanche; it is not one at all,
  // and counting it would bury the distribution under the quiet majority.
  if (!Number.isInteger(explosions) || explosions < 1) return -1
  if (explosions === 1) return 0
  if (explosions === 2) return 1
  if (explosions <= 4) return 2
  if (explosions <= 8) return 3
  if (explosions <= 16) return 4
  if (explosions <= 32) return 5
  if (explosions <= 64) return 6
  return 7
}

export type Stats = {
  played: Record<Mode, number>
  won: Record<Mode, number>
  longestCascade: number
  /** Counts per bucket, length AVALANCHE_BUCKETS. */
  avalanches: number[]
}

export const EMPTY_STATS: Stats = {
  played: { hotseat: 0, ai: 0, p2p: 0 },
  won: { hotseat: 0, ai: 0, p2p: 0 },
  longestCascade: 0,
  avalanches: Array.from({ length: AVALANCHE_BUCKETS }, () => 0),
}

/** Tolerates a stored array of the wrong length, which is what a schema change
 *  looks like from the other side. */
function normaliseBuckets(stored: unknown): number[] {
  const out = Array.from({ length: AVALANCHE_BUCKETS }, () => 0)
  if (!Array.isArray(stored)) return out
  for (let bucket = 0; bucket < AVALANCHE_BUCKETS; bucket += 1) {
    const value: unknown = stored[bucket]
    out[bucket] = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
  }
  return out
}

export function readStats(): Stats {
  if (typeof window === 'undefined') return EMPTY_STATS
  try {
    /*
     * Newest key first, then each older one. A player who has been playing
     * since before the buckets existed keeps their games-played and their
     * longest chain; the distribution simply starts from empty, because those
     * avalanches were never recorded and inventing them would be worse than
     * an honest gap.
     */
    const raw =
      window.localStorage.getItem(KEY) ??
      window.localStorage.getItem(V1_KEY) ??
      window.localStorage.getItem(LEGACY_KEY)
    if (raw === null) return EMPTY_STATS
    const parsed = JSON.parse(raw) as Partial<Stats>
    return {
      played: { ...EMPTY_STATS.played, ...parsed.played },
      won: { ...EMPTY_STATS.won, ...parsed.won },
      longestCascade: parsed.longestCascade ?? 0,
      avalanches: normaliseBuckets(parsed.avalanches),
    }
  } catch {
    return EMPTY_STATS
  }
}

function write(stats: Stats): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats))
  } catch {
    // Storage unavailable. Stats are a nicety; the game is not.
  }
}

export function recordResult(
  mode: Mode,
  won: boolean,
  longestCascade: number,
  /** Explosions per move for the game just finished, in play order. Every
   *  move is offered; the quiet ones fall out at the bucket. */
  cascades: readonly number[] = [],
): Stats {
  const stats = readStats()
  const avalanches = [...stats.avalanches]

  for (const explosions of cascades) {
    const bucket = avalancheBucket(explosions)
    if (bucket >= 0) avalanches[bucket] += 1
  }

  const next: Stats = {
    played: { ...stats.played, [mode]: stats.played[mode] + 1 },
    won: { ...stats.won, [mode]: stats.won[mode] + (won ? 1 : 0) },
    longestCascade: Math.max(stats.longestCascade, longestCascade),
    avalanches,
  }
  if (typeof window !== 'undefined') write(next)
  return next
}
