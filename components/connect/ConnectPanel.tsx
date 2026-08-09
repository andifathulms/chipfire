'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { LinkStatus } from '@/lib/net/channel'
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
  failure: {
    id: 'Koneksi langsung tidak berhasil. Sebagian jaringan memang tidak mendukung.',
    en: 'The direct connection did not work. Some networks simply do not allow it.',
  },
  fallback: { id: 'Main hotseat saja', en: 'Play hotseat instead' },
} as const

function CodeBox({ code, locale }: { code: string; locale: Locale }) {
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
  offerCode,
  answerCode,
  error,
  onHost,
  onRole,
  onJoin,
  onConfirm,
}: {
  locale: Locale
  role: Role | null
  status: LinkStatus
  offerCode: string
  answerCode: string
  error: string | null
  onHost: () => void
  onRole: (role: Role) => void
  onJoin: (code: string) => void
  onConfirm: (code: string) => void
}) {
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
            </div>
          ) : null}
        </div>
      ) : null}

      {role === 'guest' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm">{COPY.pasteOffer[locale]}</p>
            <PasteBox locale={locale} onSubmit={onJoin} />
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
          <p>{COPY.failure[locale]}</p>
          {error !== null ? <p className="font-mono text-xs text-trace-faint">{error}</p> : null}
          <Link href={`/${locale}/main/`} className="underline">
            {COPY.fallback[locale]}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
