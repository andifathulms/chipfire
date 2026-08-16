'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n'

/**
 * DESIGN-REWORK.md §7: one `error.tsx` per route, all six wrapping this. A
 * route boundary receives only `error` and `reset` — no `params` — so the
 * locale comes from the URL itself rather than being threaded in, same as
 * any other client-only read here.
 */
const COPY = {
  title: { id: 'Halaman gagal dimuat', en: 'This page failed to load' },
  body: {
    id: 'Coba lagi, atau kembali ke beranda. Ini tidak memengaruhi permainan lain yang sedang berjalan.',
    en: 'Try again, or go back home. This does not affect any other game in progress.',
  },
  retry: { id: 'Coba lagi', en: 'Try again' },
  home: { id: 'Ke beranda', en: 'Go home' },
} as const

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const segment = pathname.split('/').filter(Boolean)[0]
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE

  // No error-reporting service exists in this static site; the console is
  // the only place this is ever going to be visible to report a bug from.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <p className="label-micro text-p1-ink">{COPY.title[locale]}</p>
      <p className="max-w-prose text-sm text-trace-soft">{COPY.body[locale]}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="border border-trace bg-trace px-4 py-2 text-sm text-chart transition-opacity hover:opacity-85"
        >
          {COPY.retry[locale]}
        </button>
        <Link
          href={`/${locale}/`}
          className="border border-trace-rule px-4 py-2 text-sm transition-colors hover:bg-chart-deep"
        >
          {COPY.home[locale]}
        </Link>
      </div>
    </main>
  )
}
