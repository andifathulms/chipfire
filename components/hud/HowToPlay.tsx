'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Orbs } from '@/components/board/Orbs'
import { playerName } from '@/lib/players'
import type { Locale } from '@/lib/i18n'

/**
 * Chain Reaction is not self-evident: the conversion rule is the whole game,
 * and nothing on the board announces it. This panel opens by itself the first
 * time and stays one click away afterwards.
 *
 * Indonesian first, plain and short.
 */
const SEEN_KEY = 'rantai.seen-help.v1'

const COPY = {
  title: { id: 'Cara main', en: 'How to play' },
  goal: {
    id: 'Tujuannya: buat semua orb di papan jadi milikmu.',
    en: 'The goal: make every orb on the board yours.',
  },
  rules: {
    id: [
      'Giliranmu, taruh satu orb di sel kosong atau sel yang sudah kamu miliki. Sel lawan tidak bisa diklik.',
      'Tiap sel punya batas: 2 orb di sudut, 3 di tepi, 4 di tengah. Titik-titik samar di sel kosong menunjukkan batasnya.',
      'Begitu batas tercapai, sel meledak. Satu orb terlempar ke tiap tetangga, dan tetangga yang kena berpindah jadi milikmu — berapa pun orb yang tadinya ada di sana.',
      'Ledakan bisa membuat tetangganya ikut penuh, lalu ikut meledak. Di situlah satu langkah bisa membalik separuh papan.',
    ],
    en: [
      'On your turn, place one orb in an empty cell or one you already own. Opponent cells cannot be clicked.',
      'Every cell has a limit: 2 in corners, 3 on edges, 4 in the middle. The faint dots in an empty cell show its limit.',
      'On reaching the limit the cell explodes. One orb goes to each neighbour, and every neighbour it reaches becomes yours — however many orbs were sitting there.',
      'An explosion can push neighbours over their own limit, and so on. That is how one move flips half the board.',
    ],
  },
  legendTitle: { id: 'Membaca papan', en: 'Reading the board' },
  legend: {
    id: [
      'Warna dan bentuk orb menandai pemiliknya. Keduanya, bukan warna saja.',
      'Sel yang bergetar tinggal satu orb lagi meledak — milik siapa pun itu.',
      'Arahkan kursor (atau ketuk sekali di layar sentuh) ke sel yang bisa dimainkan untuk melihat sejauh mana ledakannya merambat sebelum kamu putuskan.',
    ],
    en: [
      'Colour and orb shape both mark the owner. Both, never colour alone.',
      'A trembling cell is one orb away from detonating — whoever owns it.',
      'Hover a playable cell (or tap once on a touch screen) to see how far the chain would reach before you commit.',
    ],
  },
  close: { id: 'Mengerti', en: 'Got it' },
  tryIt: { id: 'Coba langsung, 2 menit', en: 'Try it hands-on, 2 minutes' },
  reopen: { id: 'Cara main', en: 'How to play' },
} as const

export function HowToPlay({ locale, players }: { locale: Locale; players: number }) {
  const [open, setOpen] = useState(false)

  // First visit gets the panel; later visits get the button.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY) === null) setOpen(true)
    } catch {
      // Storage unavailable. Not worth blocking on.
    }
  }, [])

  const dismiss = () => {
    setOpen(false)
    try {
      window.localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // As above.
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start border border-trace/30 px-3 py-1 text-sm transition-colors hover:bg-chart-deep"
      >
        {COPY.reopen[locale]}
      </button>
    )
  }

  return (
    <section className="flex flex-col gap-4 border border-trace bg-chart-deep/70 p-5">
      <h2 className="font-numeral text-xl">{COPY.title[locale]}</h2>
      <p className="text-sm">{COPY.goal[locale]}</p>

      <ol className="flex flex-col gap-2 text-sm text-trace-soft">
        {COPY.rules[locale].map((rule, position) => (
          <li key={rule} className="flex gap-3">
            <span className="font-numeral text-trace">{position + 1}</span>
            <span className="max-w-prose">{rule}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 border-t border-trace/20 pt-3">
        <p className="text-sm">{COPY.legendTitle[locale]}</p>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: players }, (_, player) => (
            <span key={player} className="flex items-center gap-2 text-xs text-trace-soft">
              <span className="h-5 w-5">
                <Orbs player={player} count={1} />
              </span>
              {playerName(player, locale)}
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-1 text-sm text-trace-soft">
          {COPY.legend[locale].map((line) => (
            <li key={line} className="max-w-prose">
              — {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={dismiss}
          className="border border-trace px-4 py-1 text-sm transition-colors hover:bg-chart"
        >
          {COPY.close[locale]}
        </button>
        <Link href={`/${locale}/belajar/`} className="text-sm underline">
          {COPY.tryIt[locale]}
        </Link>
      </div>
    </section>
  )
}
