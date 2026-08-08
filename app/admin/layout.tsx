'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Store,
  Star,
  TrendingUp,
  Users,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import BrandLogo from '@/components/shared/BrandLogo'
import { siteChromePad } from '@/components/siteChrome'

const navLinks = [
  { href: '/admin', label: 'Översikt', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
  {
    href: '/admin/growth',
    label: 'Tillväxt',
    icon: TrendingUp,
    match: (p: string) => p.startsWith('/admin/growth'),
  },
  {
    href: '/admin/marketplace',
    label: 'Marknad',
    icon: Store,
    match: (p: string) => p.startsWith('/admin/marketplace'),
  },
  {
    href: '/admin/users',
    label: 'Användare',
    icon: Users,
    match: (p: string) => p.startsWith('/admin/users'),
  },
  {
    href: '/admin/providers',
    label: 'Talanger',
    icon: UserRound,
    match: (p: string) => p.startsWith('/admin/providers'),
  },
  {
    href: '/admin/bookings',
    label: 'Bokningar',
    icon: Calendar,
    match: (p: string) => p.startsWith('/admin/bookings'),
  },
  {
    href: '/admin/reviews',
    label: 'Recensioner',
    icon: Star,
    match: (p: string) => p.startsWith('/admin/reviews'),
  },
  {
    href: '/admin/messages',
    label: 'Konversationer',
    icon: MessageSquare,
    match: (p: string) => p.startsWith('/admin/messages'),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className={siteChromePad}>
          <div className="flex h-16 items-center justify-between gap-4 min-[1440px]:h-20">
            <div className="flex items-center gap-3">
              <BrandLogo href="/admin" />
              <span className="hidden text-[13px] font-medium text-muted-foreground sm:inline">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden />
                Till sajten
              </Link>
            </div>
          </div>
        </div>

        <nav
          className={cn(siteChromePad, 'overflow-x-auto border-t border-border/70')}
          aria-label="Admin"
        >
          <div className="flex gap-1 py-2">
            {navLinks.map(link => {
              const active = link.match(pathname)
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} aria-hidden />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <main className={cn(siteChromePad, 'mx-auto w-full max-w-6xl py-8 sm:py-10')}>
        {children}
      </main>
    </div>
  )
}
