import Link from 'next/link'
import { copy, type Locale } from '@/lib/i18n'
import { MakerSignature } from './MakerSignature'

/**
 * The one bottom bar for the whole site.
 *
 * The home page used to carry this on its own and every other page had no
 * footer at all. Rather than stack a second seam under it, that bar moved here
 * and now runs everywhere — which is also how the language switch stopped
 * being reachable only from the home page.
 *
 * Two groups, one rule above them: what the site is on the left, who made it
 * on the right. The maker's mark is personal credit, not a legal notice, so it
 * stays visually its own thing rather than merging into the line beside it.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy(locale)

  return (
    /* Was text-xs — 12px, under the readable floor for anything anyone is
       expected to actually read, and the language switch lives here. */
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-trace/20 px-4 py-4 text-sm sm:flex-row sm:items-start sm:justify-between lg:px-8">
      <div className="flex flex-col items-start gap-1.5 text-trace-faint">
        <span>{t.footer}</span>
        <Link
          href={locale === 'id' ? '/en/' : '/id/'}
          className="underline decoration-trace-faint underline-offset-2 transition-colors hover:text-p1-ink hover:decoration-p1-ink"
        >
          {locale === 'id' ? 'English' : 'Bahasa Indonesia'}
        </Link>
      </div>

      <MakerSignature locale={locale} />
    </footer>
  )
}
