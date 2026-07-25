'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Pages that manage their own full header — hide the global nav on these
const EXCLUDED = [
  '/',
  '/signup',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
]

function isExcluded(pathname: string): boolean {
  if (EXCLUDED.includes(pathname)) return true
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/booking/') && pathname.endsWith('/messages')) return true
  if (pathname.startsWith('/dashboard')) return true
  if (pathname.startsWith('/planner')) return true
  return false
}

export default function SiteNav() {
  const pathname = usePathname()
  if (isExcluded(pathname)) return null

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[#E8E3DC]">
      <div className="flex items-center px-4 h-12">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[#1A1A2E] hover:text-[#FF6B35] transition-colors"
        >
          FESTEN.
        </Link>
      </div>
    </header>
  )
}
