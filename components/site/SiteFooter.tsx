import Link from 'next/link'
import { copy, type Locale } from '@/lib/i18n'
import { MakerSignature } from './MakerSignature'

/**
 * The one bottom bar for the whole site.
 *
 * The home page used to carry this on its own and every other page had no
 * footer at all. Rather than stack a second seam under it, that bar moved here
 * and now runs everywhere.
 *
 * Two groups, one rule above them: what the site is on the left, who made it
 * on the right. The maker's mark is personal credit, not a legal notice, so it
 * stays visually its own thing rather than merging into the line beside it.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy(locale)

  /*
   * Language and theme moved up into SiteHeader, where they are reachable
   * without scrolling past a game. What is left is the colophon: what the site
   * is, and who made it.
   */
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 border-t border-trace-hairline px-3 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8">
      <span className="flex flex-col gap-1 text-trace-faint">
        {t.footer}
        {/* The header's language switch is hidden on a phone; this is that
            switch there. It goes to the other language's home page, since the
            footer has no idea which page it is on. */}
        <Link
          href={locale === 'id' ? '/en/' : '/id/'}
          className="self-start underline decoration-trace-faint underline-offset-2 sm:hidden"
        >
          {locale === 'id' ? 'English' : 'Bahasa Indonesia'}
        </Link>
      </span>
      <MakerSignature locale={locale} />
    </footer>
  )
}
