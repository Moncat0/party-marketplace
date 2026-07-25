'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number | null
}

type Props = {
  name: string | null
  role: 'planner' | 'provider'
  navItems: NavItem[]
  modeSwitcher?: { href: string; label: string }
  children: React.ReactNode
}

export default function DashboardShell({ name, role, navItems, modeSwitcher, children }: Props) {
  const pathname = usePathname()
  const firstName = name?.split(' ')[0] ?? null
  const initial = (name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-[#EBEBEB] flex flex-col sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#EBEBEB]">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#FF6B35]">FESTEN.</Link>
        </div>

        {/* User */}
        <div className="px-6 py-5 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-sm font-bold text-[#FF6B35] flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1A2E] truncate">{name ?? 'Användare'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                role === 'provider'
                  ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]'
                  : 'bg-[#FF6B35]/10 text-[#FF6B35]'
              }`}>
                {role === 'provider' ? 'Talang' : 'Planerare'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                    : 'text-[#717171] hover:bg-[#F7F7F7] hover:text-[#1A1A2E]'
                }`}
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

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-[#EBEBEB] space-y-0.5">
          {modeSwitcher && (
            <Link
              href={modeSwitcher.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#717171] hover:bg-[#F7F7F7] hover:text-[#1A1A2E] transition-colors"
            >
              <span className="w-5">⇄</span>
              <span>{modeSwitcher.label}</span>
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#717171] hover:bg-[#F7F7F7] hover:text-[#1A1A2E] transition-colors"
            >
              <span className="w-5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              <span>Logga ut</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-[#EBEBEB] px-8 py-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-[#1A1A2E]">
            Hej{firstName ? `, ${firstName}` : ''} 👋
          </p>
          <p className="text-sm text-[#717171]">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="px-8 py-8">
          {children}
        </div>
      </div>

    </div>
  )
}
