'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import BrandLogo from '@/components/shared/BrandLogo'
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

/** Host / provider shell — Festly tokens + Airbnb hosting left rail. */
export default function DashboardShell({
  name,
  role,
  navItems,
  modeSwitcher,
  children,
  flush,
}: Props) {
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
      <div
        className="px-6 py-5"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        <BrandLogo />
      </div>

      <div
        className="px-6 py-5"
        style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: t.colors.ink }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: t.colors.ink }}>
              {name ?? 'Användare'}
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: t.colors.muted }}>
              {role === 'provider' ? 'Talangläge' : 'Planerarläge'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'font-semibold'
                  : 'font-medium hover:bg-[#f7f7f7]'
              )}
              style={{
                color: t.colors.ink,
                background: active ? t.colors.surfaceStrong : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 flex-shrink-0 opacity-80">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div
        className="flex flex-col gap-0.5 px-3 py-4"
        style={{ borderTop: `1px solid ${t.colors.hairlineSoft}` }}
      >
        {modeSwitcher && (
          <Button
            asChild
            variant="ghost"
            className="h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            style={{ color: t.colors.muted }}
          >
            <Link href={modeSwitcher.href} onClick={() => setDrawerOpen(false)}>
              <span className="w-5" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5" />
                  <path d="M8 21H3v-5" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </span>
              <span>{modeSwitcher.label}</span>
            </Link>
          </Button>
        )}
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            style={{ color: t.colors.muted }}
          >
            <span className="w-5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Logga ut</span>
          </Button>
        </form>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-white">
      <aside
        className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col bg-white lg:flex"
        style={{ borderRight: `1px solid ${t.colors.hairline}` }}
      >
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Stäng meny"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div
          className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-3 bg-white px-4 lg:hidden"
          style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full"
            aria-label="Öppna meny"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
          <BrandLogo />
          <span
            className="ml-auto max-w-[40%] truncate text-sm font-medium"
            style={{ color: t.colors.ink }}
          >
            {name?.split(' ')[0] ?? ''}
          </span>
        </div>

        {/* Desktop context strip — matches marketplace identity */}
        {!flush && (
          <div
            className="sticky top-0 z-20 hidden h-14 flex-shrink-0 items-center justify-between bg-white px-8 lg:flex"
            style={{ borderBottom: `1px solid ${t.colors.hairlineSoft}` }}
          >
            <p className="text-[14px] font-medium" style={{ color: t.colors.muted }}>
              {role === 'provider' ? 'Talangläge' : 'Planerarläge'}
            </p>
            {modeSwitcher && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-auto rounded-full px-3 py-1.5 text-[14px] font-medium"
                style={{ color: t.colors.ink }}
              >
                <Link href={modeSwitcher.href}>{modeSwitcher.label}</Link>
              </Button>
            )}
          </div>
        )}

        <div
          className={
            flush
              ? 'min-h-0 flex-1 overflow-hidden'
              : 'mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-8 sm:py-10'
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}
