'use client'

import type { ReactNode } from 'react'
import MarketplaceHeader, { type NavMode } from '@/components/MarketplaceHeader'

type Props = {
  children: ReactNode
  currentMode?: NavMode
  /** Full-bleed content (e.g. messages split) vs padded page */
  flush?: boolean
  className?: string
}

/** Airbnb guest chrome: marketplace header + content, no dashboard sidebar. */
export default function GuestAppChrome({
  children,
  currentMode = 'planner',
  flush = false,
  className = '',
}: Props) {
  return (
    <div className={`flex min-h-dvh flex-col bg-white ${className}`}>
      <MarketplaceHeader currentMode={currentMode} />
      {flush ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      ) : (
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          {children}
        </main>
      )}
    </div>
  )
}
