'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Container from '@/components/Container'
import { settingsTokens as t } from '@/components/settings/tokens'

type Props = {
  /** Where Klar navigates — planner home or provider dashboard */
  doneHref: string
  children: ReactNode
}

/**
 * Airbnb account chrome using the clone's Container for edge alignment:
 * https://github.com/Luancss/next13-airbnb-clone/blob/master/app/components/Container.tsx
 */
export default function AccountLayout({ doneHref, children }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header
        className="sticky top-0 z-40 bg-white"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        <Container>
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="text-[18px] font-bold tracking-tight text-[#FF6B35]">
              FESTEN.
            </Link>
            <Link
              href={doneHref}
              className="inline-flex items-center justify-center h-10 px-5 text-[14px] font-medium text-[#222222] bg-[#f2f2f2] hover:bg-[#ebebeb] rounded-full transition-colors"
              style={{ transitionDuration: t.motion.fast }}
            >
              Klar
            </Link>
          </div>
        </Container>
      </header>

      <main className="py-10 md:py-12">
        <Container>{children}</Container>
      </main>
    </div>
  )
}
