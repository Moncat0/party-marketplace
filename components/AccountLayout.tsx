'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { settingsTokens as t } from '@/components/settings/tokens'
import BrandLogo from '@/components/shared/BrandLogo'
import { siteChromePad, siteHeaderRow } from '@/components/siteChrome'

type Props = {
  doneHref: string
  children: ReactNode
}

/**
 * Airbnb account-settings chrome.
 * Logo size, bar height, and side padding match MarketplaceHeader via siteChrome.
 */
export default function AccountLayout({ doneHref, children }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header
        className="sticky top-0 z-40 bg-white"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        <div className={siteChromePad}>
          <div className={siteHeaderRow}>
            <BrandLogo />
            <Link
              href={doneHref}
              className="ml-auto inline-flex h-10 items-center justify-center rounded-full bg-[#f2f2f2] px-5 text-[14px] font-medium text-[#222222] transition-colors hover:bg-[#ebebeb]"
              style={{ transitionDuration: t.motion.fast }}
            >
              Klar
            </Link>
          </div>
        </div>
      </header>

      <main className="py-10 md:py-12">
        <div className={siteChromePad}>{children}</div>
      </main>
    </div>
  )
}
