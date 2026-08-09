'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { Wordmark } from '@/components/site/Mark'

const target = `/${DEFAULT_LOCALE}/`

/**
 * Static export cannot redirect at the edge, so the root hops to the default
 * locale on mount. The link below is the no-JavaScript path.
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(target)
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Link href={target} className="font-numeral text-2xl">
        <Wordmark className="gap-3" nameClassName="underline" />
      </Link>
    </main>
  )
}
