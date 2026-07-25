'use client'

import { usePathname } from 'next/navigation'
import MarketplaceHeader from '@/components/MarketplaceHeader'

// Pages that render their own MarketplaceHeader (or have no public chrome)
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
  if (pathname.startsWith('/providers/')) return true
  return false
}

/** Airbnb-style marketplace nav on public pages that don't own a header. */
export default function SiteNav() {
  const pathname = usePathname()
  if (isExcluded(pathname)) return null

  return <MarketplaceHeader currentMode="planner" />
}
