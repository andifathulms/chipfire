'use client'

import { useEffect, useRef, useState } from 'react'
import { cellName } from '@/lib/engine/notation'
import type { MoveSummary } from '@/lib/engine/replay'
import type { GameState } from '@/lib/engine/state'
import type { Locale } from '@/lib/i18n'
import { playerName } from '@/lib/players'

/**
 * What just happened, said out loud.
 *
 * The game was silent to a screen reader in the two places it mattered most.
 * Whose turn it is lived in `aria-current` on a div — a state you can find by
 * exploring, not an event you are told about — so after a cascade resolved,
 * nothing announced that play had come back to you. And the cascade itself
 * reported nothing at all: a sighted player watches forty cells detonate, a
 * screen reader user gets a changed board and no explanation.
 *
 * The same gap is the reduced-motion gap. PRD §9.1 promises instantaneous
 * resolution *and a summary of what happened*; the resolution shipped and the
 * summary never did, so a player who asked for less motion got less
 * information rather than the same information faster. One region fixes both,
 * because it is the same missing sentence.
 *
 * One region, one sentence per move — who played where, what it set off, and
 * who is up now. Two regions would talk over each other, which is why the
 * conditional aria-live spans in TurnIndicator are removed in the same change:
 * they never fired anyway, being mounted at the moment they were supposed to
 * speak, which is too late for a live region to be read.
 *
 * `role="status"` is added deliberately and it is the one place in this pass
 * that adds a role: there is no native element that reliably provides a polite
 * announcement region — `<output>` is the closest and is not announced
 * consistently across screen readers.
 */
const COPY = {
  placed: {
    id: (who: string, where: string) => `${who} di ${where}.`,
    en: (who: string, where: string) => `${who} to ${where}.`,
  },
  cascade: {
    id: (explosions: number, captures: number) =>
      ` ${explosions} ledakan, ${captures} sel direbut.`,
    en: (explosions: number, captures: number) =>
      ` ${explosions} explosions, ${captures} cells taken.`,
  },
  next: {
    id: (who: string) => ` Giliran ${who}.`,
    en: (who: string) => ` ${who} to play.`,
  },
  wins: {
    id: (who: string) => ` ${who} menang.`,
    en: (who: string) => ` ${who} wins.`,
  },
} as const

export function MoveAnnouncer({
  state,
  history,
  cols,
  locale,
  /** False while the cascade is still playing. The summary is only true once
   *  the board has finished resolving, and saying it early would describe a
   *  position that is not there yet. */
  settled,
}: {
  state: GameState
  history: readonly MoveSummary[]
  cols: number
  locale: Locale
  settled: boolean
}) {
  const [message, setMessage] = useState('')
  const announcedFor = useRef(0)

  const count = history.length

  useEffect(() => {
    /*
     * Only ever on a move forward. Undo and reset shorten the list, and
     * re-reading the previous move as though it had just been played would be
     * worse than saying nothing.
     */
    if (count <= announcedFor.current) {
      announcedFor.current = count
      return
    }
    if (!settled) return

    const last = history[count - 1]
    if (last === undefined) return
    announcedFor.current = count

    let text = COPY.placed[locale](playerName(last.player, locale), cellName(cols, last.index))
    if (last.explosions > 0) text += COPY.cascade[locale](last.explosions, last.captures)
    text +=
      state.winner === null
        ? COPY.next[locale](playerName(state.current, locale))
        : COPY.wins[locale](playerName(state.winner, locale))

    setMessage(text)
  }, [count, settled, history, cols, locale, state.current, state.winner])

  // Mounted for the life of the screen, empty until there is something to say.
  // A region added at the moment its content changes is not announced.
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  )
}
