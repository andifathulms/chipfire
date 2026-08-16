'use client'

/**
 * DESIGN-REWORK.md §7: "a root global-error.tsx that assumes no tokens are
 * available." This replaces the root layout entirely when the layout itself
 * — or anything not caught by a route-level error.tsx (components/site/
 * RouteError.tsx) — throws, so it cannot assume globals.css loaded, that
 * Tailwind's classes compiled, or that any `--color-*` custom property
 * exists. Every colour below is a literal, hand-matched to the light and
 * night palette in globals.css rather than referencing it. No locale either:
 * this sits above `[locale]`, so the copy is stated in both.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Chipfire</title>
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background-color: #171A18 !important; color: #E8E4DC !important; }
            button { border-color: #E8E4DC !important; background-color: #E8E4DC !important; color: #171A18 !important; }
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#EDEAE3',
          color: '#1F2421',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500, maxWidth: '32rem' }}>
          Halaman ini gagal dimuat. Coba lagi.
          <br />
          This page failed to load. Try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: '1px solid #1F2421',
            backgroundColor: '#1F2421',
            color: '#EDEAE3',
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Coba lagi / Try again
        </button>
      </body>
    </html>
  )
}
