'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { settingsTokens as t } from '@/components/settings/tokens'

type NavItem = {
  href: string
  label: string
  icon: ReactNode
  badge?: number | null
}

type Props = {
  name: string | null
  role: 'planner' | 'provider'
  navItems: NavItem[]
  modeSwitcher?: { href: string; label: string }
  children: ReactNode
  /** Edge-to-edge main (e.g. messages split pane) */
  flush?: boolean
}

/** Host / provider shell — Airbnb hosting-style left rail with mobile drawer. */
export default function DashboardShell({ name, role, navItems, modeSwitcher, children, flush }: Props) {
  const pathname = usePathname()
  const initial = (name ?? '?').charAt(0).toUpperCase()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function isActive(href: string) {
    if (pathname === href) return true
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  const sidebar = (
    <>
      <div className="px-6 py-5 border-b" style={{ borderColor: t.colors.hairline }}>
        <Link href="/" className="text-lg font-bold tracking-tight text-[#FF6B35]">
          FESTEN.
        </Link>
      </div>

      <div className="px-6 py-5 border-b" style={{ borderColor: t.colors.hairlineSoft }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#222222]/10 flex items-center justify-center text-sm font-bold text-[#222222] flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#222222] truncate">{name ?? 'Användare'}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#222222]/10 text-[#222222]">
              {role === 'provider' ? 'Talang' : 'Planerare'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors"
              style={{
                borderRadius: t.rounded.sm,
                fontWeight: active ? 600 : 500,
                color: t.colors.ink,
                backgroundColor: active ? t.colors.canvas : 'transparent',
                border: active ? `1px solid ${t.colors.ink}` : '1px solid transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-[#FF6B35] px-2 py-0.5 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: t.colors.hairlineSoft }}>
        {modeSwitcher && (
          <Link
            href={modeSwitcher.href}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6A6A6A] hover:bg-[#F2F2F2] hover:text-[#222222] transition-colors"
          >
            <span className="w-5">⇄</span>
            <span>{modeSwitcher.label}</span>
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6A6A6A] hover:bg-[#F2F2F2] hover:text-[#222222] transition-colors"
          >
            <span className="w-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Logga ut</span>
          </button>
        </form>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r flex-col sticky top-0 h-screen" style={{ borderColor: t.colors.hairline }}>
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Stäng meny"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Mobile top bar */}
        <div
          className="lg:hidden sticky top-0 z-30 bg-white px-4 h-14 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f2f2]"
            aria-label="Öppna meny"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/" className="text-base font-bold tracking-tight text-[#FF6B35]">
            FESTEN.
          </Link>
          <span className="ml-auto text-sm font-medium text-[#222222] truncate max-w-[40%]">
            {name?.split(' ')[0] ?? ''}
          </span>
        </div>

        <div className={flush ? 'flex-1 min-h-0 overflow-hidden' : 'px-4 py-6 sm:px-8 sm:py-8 flex-1'}>
          {children}
        </div>
      </div>
    </div>
  )
}
