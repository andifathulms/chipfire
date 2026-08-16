'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FailureCause, IceReport, LinkStatus } from '@/lib/net/channel'
import { formatForReading } from '@/lib/net/signal'
import type { Locale } from '@/lib/i18n'
import type { Role } from '@/components/game/useP2PGame'

/**
 * Honest about state at every step: generating, waiting, connecting,
 * connected, failed. Never a spinner that goes nowhere.
 *
 * Some connections genuinely cannot work — symmetric NAT and strict corporate
 * networks need a TURN relay, which is a paid server and out of scope. When
 * that happens the panel says so plainly and offers hotseat right there,
 * rather than pretending (PRD §7, §9.4).
 */
const COPY = {
  title: { id: 'Tanding', en: 'Versus' },
  intro: {
    id: 'Dua perangkat, tersambung langsung. Tidak ada server: kalian berdua yang bertukar kode.',
    en: 'Two devices, connected directly. There is no server — the two of you exchange the codes.',
  },
  hostRole: { id: 'Saya yang mengundang', en: 'I am inviting' },
  guestRole: { id: 'Saya diundang', en: 'I was invited' },
  /*
   * DESIGN-REWORK.md §6: once connected, the whole ceremony above collapses
   * to this — a noun, not the first-person sentence the role-selection
   * buttons use, because this is a fact stated about the session rather than
   * a choice being made.
   */
  connectedRole: {
    host: { id: 'Pengundang', en: 'Host' },
    guest: { id: 'Tamu', en: 'Guest' },
  },
  showCode: { id: 'Lihat kode', en: 'Show code' },
  offerLabel: {
    id: '1. Kirim kode ini ke lawanmu',
    en: '1. Send this code to your opponent',
  },
  answerWait: {
    id: '2. Tempel kode balasan dari lawanmu',
    en: '2. Paste the reply code from your opponent',
  },
  pasteOffer: { id: '1. Tempel kode undangan', en: '1. Paste the invitation code' },
  sendAnswer: {
    id: '2. Kirim kode balasan ini kembali',
    en: '2. Send this reply code back',
  },
  copy: { id: 'Salin', en: 'Copy' },
  copied: { id: 'Tersalin', en: 'Copied' },
  submit: { id: 'Lanjut', en: 'Continue' },
  status: {
    idle: { id: 'Belum tersambung', en: 'Not connected' },
    generating: { id: 'Menyiapkan kode…', en: 'Preparing the code…' },
    waiting: { id: 'Menunggu balasan', en: 'Waiting for the reply' },
    connecting: { id: 'Menyambungkan…', en: 'Connecting…' },
    connected: { id: 'Tersambung', en: 'Connected' },
    failed: { id: 'Gagal', en: 'Failed' },
    closed: { id: 'Terputus', en: 'Disconnected' },
  },
  /*
   * Two failures, two remedies. Saying "some networks do not allow it" for both
   * is how someone spends an evening blaming their router for a STUN request
   * that never left the building.
   */
  failure: {
    /*
     * "This device", not "both sides". The tally is local — nothing here has
     * any information about what the other machine gathered — and the first
     * draft of this message asserted otherwise, which is the same overclaim it
     * was written to replace.
     */
    'no-route': {
      id: 'Perangkat ini menemukan alamatnya, tapi tidak ada jalur yang terbuka ke lawanmu.',
      en: 'This device found its addresses, but no path to your opponent opened.',
    },
    'no-stun': {
      id: 'Tidak ada satu pun alamat publik yang ditemukan: server STUN tidak menjawab. Biasanya karena jaringan memblokir UDP ke luar, atau perangkat sedang offline. Coba jaringan lain — hotspot ponsel sering cukup.',
      en: 'No public address was found at all: the STUN server never answered. Usually that means the network blocks outbound UDP, or the device is offline. Another network often fixes it — a phone hotspot is usually enough.',
    },
    unknown: {
      id: 'Koneksi langsung tidak berhasil.',
      en: 'The direct connection did not work.',
    },
  },
  tally: { id: 'Alamat yang ditemukan perangkat ini', en: 'Addresses this device found' },

  /*
   * Ordered by how often each actually works, which is not the order they came
   * to mind in. The first version of this message led with "turn off your VPN"
   * and never mentioned the one remedy that nearly always succeeds: put both
   * devices on one network, where they reach each other by local address and
   * never traverse NAT at all. Data on a phone is the worst case — carrier NAT
   * is symmetric almost everywhere — and no amount of retrying changes that.
   */
  remedies: {
    id: [
      'Sambungkan kedua perangkat ke Wi-Fi yang sama. Ini yang paling sering berhasil: keduanya saling menyapa lewat alamat lokal, tanpa perlu menembus NAT sama sekali.',
      'Kalau tidak ada Wi-Fi bersama, nyalakan hotspot di satu ponsel dan sambungkan perangkat satunya ke situ — hasilnya sama: satu jaringan.',
      'Matikan VPN di kedua sisi kalau ada, lalu ulangi dari awal.',
      'Data seluler adalah kasus terburuk: NAT operator hampir selalu simetris, dan dua-duanya di data seluler biasanya memang tidak bisa.',
    ],
    en: [
      'Put both devices on the same Wi-Fi. This is the one that nearly always works: they reach each other by local address and never traverse NAT at all.',
      'No shared Wi-Fi? Turn on a hotspot on one phone and connect the other device to it — same effect: one network.',
      'Turn off any VPN on both sides, then start over.',
      'Mobile data is the worst case: carrier NAT is almost always symmetric, and two devices both on mobile data usually cannot connect at all.',
    ],
  },
  caveat: {
    id: 'Sebagian Wi-Fi publik dan kantor memblokir lalu lintas antar-perangkat, jadi satu jaringan pun belum tentu cukup di sana.',
    en: 'Some public and office Wi-Fi blocks device-to-device traffic, so even one network is not always enough there.',
  },
  noRelay: {
    id: 'Kalau semuanya sudah dicoba dan tetap gagal, ini memang kasus yang butuh server relay. Chipfire sengaja tidak punya — itu berarti server berbayar, dan sebagian koneksi memang tidak akan pernah bisa.',
    en: 'If all of that fails, this genuinely is the case that needs a relay server. Chipfire deliberately has none — that would mean a paid server — and some connections simply never work.',
  },
  cut: { id: 'pencarian terpotong waktu', en: 'search cut short by the timeout' },
  fallback: { id: 'Main hotseat saja', en: 'Play hotseat instead' },

  /*
   * A pasted code that is the wrong sort is not a network failure, and saying
   * "some networks do not allow it" when someone has pasted the wrong half of
   * the exchange blames the internet for a two-second mistake. These name what
   * actually happened and what to do about it.
   */
  wrongKind: {
    host: {
      id: 'Itu kode undangan, bukan kode balasan. Yang dibutuhkan di sini adalah kode yang muncul di layar lawanmu setelah dia menempel undanganmu.',
      en: 'That is an invitation code, not a reply. What goes here is the code that appeared on your opponent’s screen after they pasted yours.',
    },
    guest: {
      id: 'Itu kode balasan, bukan kode undangan. Yang dibutuhkan di sini adalah kode yang dikirim lawanmu lebih dulu.',
      en: 'That is a reply code, not an invitation. What goes here is the code your opponent sent you first.',
    },
  },
  badCode: {
    id: 'Kode itu tidak terbaca — mungkin terpotong saat disalin. Minta lawanmu mengirim ulang seluruhnya.',
    en: 'That code could not be read — it may have been cut short when copied. Ask your opponent to send the whole thing again.',
  },
} as const

export function CodeBox({ code, locale }: { code: string; locale: Locale }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <textarea
        readOnly
        value={formatForReading(code)}
        rows={4}
        className="w-full resize-none border border-trace-rule bg-chart-deep p-2 font-mono text-xs"
        onFocus={(event) => event.currentTarget.select()}
      />
      <button
        type="button"
        className="self-start border border-trace-rule px-3 py-1 text-sm transition-colors hover:bg-chart-deep"
        onClick={() => {
          void navigator.clipboard?.writeText(code)
          setCopied(true)
        }}
      >
        {copied ? COPY.copied[locale] : COPY.copy[locale]}
      </button>
    </div>
  )
}

function PasteBox({
  locale,
  onSubmit,
}: {
  locale: Locale
  onSubmit: (code: string) => void
}) {
  const [value, setValue] = useState('')

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(value)
      }}
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        spellCheck={false}
        className="w-full resize-none border border-trace-rule bg-chart p-2 font-mono text-xs"
      />
      <button
        type="submit"
        disabled={value.trim().length === 0}
        className="self-start border border-trace px-3 py-1 text-sm transition-colors hover:bg-chart-deep disabled:opacity-40"
      >
        {COPY.submit[locale]}
      </button>
    </form>
  )
}

export function ConnectPanel({
  locale,
  role,
  status,
  cause,
  ice,
  offerCode,
  answerCode,
  error,
  codeError,
  onHost,
  onRole,
  onJoin,
  onConfirm,
}: {
  locale: Locale
  role: Role | null
  status: LinkStatus
  /** What the local side could establish about the failure, if anything. */
  cause: FailureCause | null
  /** The local candidate tally, shown as the evidence behind the diagnosis. */
  ice: IceReport | null
  offerCode: string
  answerCode: string
  error: string | null
  /** 'kind' when the wrong half of the exchange was pasted, 'format' when the
   *  code itself is unreadable. Neither is a connection failure. */
  codeError: string | null
  onHost: () => void
  onRole: (role: Role) => void
  onJoin: (code: string) => void
  onConfirm: (code: string) => void
}) {
  /*
   * DESIGN-REWORK.md §6: once connected, the ceremony above is over and the
   * game is the only thing left, so this collapses to a one-line status
   * strip — connection state and the peer's role — with the code that got
   * this device here still reachable, not occupying the screen.
   */
  if (status === 'connected') {
    const code = role === 'guest' ? answerCode : offerCode
    return (
      <section className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border border-trace-hairline bg-chart-deep/30 px-3 py-2 text-sm">
        <p className="flex items-baseline gap-2">
          <span className="font-numeral">{COPY.status.connected[locale]}</span>
          <span aria-hidden="true" className="text-trace-faint">
            ·
          </span>
          <span className="text-trace-soft">
            {role === 'guest' ? COPY.connectedRole.guest[locale] : COPY.connectedRole.host[locale]}
          </span>
        </p>

        {code ? (
          <details>
            <summary className="label-micro cursor-pointer select-none py-1">
              {COPY.showCode[locale]}
            </summary>
            <div className="pt-2">
              <CodeBox code={code} locale={locale} />
            </div>
          </details>
        ) : null}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5 border border-trace-hairline bg-chart-deep/60 p-5">
      <div>
        <h2 className="font-numeral text-xl">{COPY.title[locale]}</h2>
        <p className="mt-1 max-w-prose text-sm text-trace-soft">{COPY.intro[locale]}</p>
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-trace-faint">
        {COPY.status[status][locale]}
      </p>

      {role === null ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onHost}
            className="border border-trace px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
          >
            {COPY.hostRole[locale]}
          </button>
          <button
            type="button"
            onClick={() => onRole('guest')}
            className="border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
          >
            {COPY.guestRole[locale]}
          </button>
        </div>
      ) : null}

      {role === 'host' ? (
        <div className="flex flex-col gap-4">
          {offerCode ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{COPY.offerLabel[locale]}</p>
              <CodeBox code={offerCode} locale={locale} />
            </div>
          ) : null}
          {offerCode ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{COPY.answerWait[locale]}</p>
              <PasteBox locale={locale} onSubmit={onConfirm} />
              {/* Beside the box that caused it, not in the failure panel — the
                  connection is still fine and still waiting for the right code. */}
              {codeError !== null ? (
                <p role="alert" className="max-w-prose border-l-2 border-p1 pl-3 text-sm text-p1-ink">
                  {codeError === 'kind' ? COPY.wrongKind.host[locale] : COPY.badCode[locale]}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {role === 'guest' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm">{COPY.pasteOffer[locale]}</p>
            <PasteBox locale={locale} onSubmit={onJoin} />
            {codeError !== null ? (
              <p role="alert" className="max-w-prose border-l-2 border-p1 pl-3 text-sm text-p1-ink">
                {codeError === 'kind' ? COPY.wrongKind.guest[locale] : COPY.badCode[locale]}
              </p>
            ) : null}
          </div>
          {answerCode ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{COPY.sendAnswer[locale]}</p>
              <CodeBox code={answerCode} locale={locale} />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === 'failed' ? (
        <div role="alert" className="flex flex-col gap-2 border border-p1 p-3 text-sm">
          <p className="max-w-prose">{COPY.failure[cause ?? 'unknown'][locale]}</p>
          {/* The numbers the verdict was read off, so it can be checked rather
              than believed. Local to this device, which is all it can see. */}
          {ice !== null ? (
            <p className="font-mono text-xs text-trace-faint">
              {COPY.tally[locale]}: host {ice.host} · srflx {ice.srflx} · relay {ice.relay}
              {ice.complete ? '' : ` · ${COPY.cut[locale]}`}
            </p>
          ) : null}

          {/* What to actually do, in the order most likely to work. Only for
              the failure that has remedies; a dead STUN has its own. */}
          {cause === 'no-route' ? (
            <>
              <ol className="flex max-w-prose list-decimal flex-col gap-1 pl-4 text-trace-soft">
                {COPY.remedies[locale].map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <p className="max-w-prose text-xs text-trace-faint">{COPY.caveat[locale]}</p>
              <p className="max-w-prose text-xs text-trace-faint">{COPY.noRelay[locale]}</p>
            </>
          ) : null}
          {error !== null ? <p className="font-mono text-xs text-trace-faint">{error}</p> : null}
          <Link href={`/${locale}/main/`} className="underline">
            {COPY.fallback[locale]}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
