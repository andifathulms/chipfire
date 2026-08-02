/**
 * Local stats only — localStorage, no server, no leaderboard (PRD §9.5).
 * Everything here is best-effort: storage can be full, disabled, or private,
 * and none of that is worth interrupting a game over.
 */
const KEY = 'rantai.stats.v1'

export type Mode = 'hotseat' | 'ai' | 'p2p'

export type Stats = {
  played: Record<Mode, number>
  won: Record<Mode, number>
  longestCascade: number
}

export const EMPTY_STATS: Stats = {
  played: { hotseat: 0, ai: 0, p2p: 0 },
  won: { hotseat: 0, ai: 0, p2p: 0 },
  longestCascade: 0,
}

export function readStats(): Stats {
  if (typeof window === 'undefined') return EMPTY_STATS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === null) return EMPTY_STATS
    const parsed = JSON.parse(raw) as Partial<Stats>
    return {
      played: { ...EMPTY_STATS.played, ...parsed.played },
      won: { ...EMPTY_STATS.won, ...parsed.won },
      longestCascade: parsed.longestCascade ?? 0,
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

export function recordResult(mode: Mode, won: boolean, longestCascade: number): Stats {
  const stats = readStats()
  const next: Stats = {
    played: { ...stats.played, [mode]: stats.played[mode] + 1 },
    won: { ...stats.won, [mode]: stats.won[mode] + (won ? 1 : 0) },
    longestCascade: Math.max(stats.longestCascade, longestCascade),
  }
  if (typeof window !== 'undefined') write(next)
  return next
}
