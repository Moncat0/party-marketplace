'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { siteChromePad, siteHeaderHeight, siteLogoClass } from '@/components/siteChrome'
import {
  ArrowLeftRight,
  Calendar,
  CircleHelp,
  LogOut,
  type LucideIcon,
  Menu,
  Settings,
  Shield,
  Star,
  User,
} from 'lucide-react'

type UserNav = {
  name: string | null
  avatarUrl: string | null
}

type Props = {
  children: ReactNode
  /** Full-bleed main (messages) */
  flush?: boolean
  /** Full viewport width with chrome padding (listings) */
  wide?: boolean
  unreadMessages?: number
}

const NAV = [
  { href: '/dashboard', label: 'Översikt', match: (p: string) => p === '/dashboard' },
  {
    href: '/dashboard/today',
    label: 'Idag',
    match: (p: string) => p.startsWith('/dashboard/today'),
  },
  {
    href: '/dashboard/listings',
    label: 'Tjänster',
    match: (p: string) => p.startsWith('/dashboard/listings'),
  },
  {
    href: '/dashboard/messages',
    label: 'Meddelanden',
    match: (p: string) => p.startsWith('/dashboard/messages'),
  },
] as const

const menuItemClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#222222] hover:bg-[#f7f7f7] transition-colors'

function MenuIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-[18px] shrink-0 text-[#222222]" strokeWidth={2} aria-hidden />
}

/**
 * Airbnb Host–style chrome for the provider dashboard:
 * top logo · centered nav · switch to planner · avatar menu.
 */
export default function ProviderHostChrome({
  children,
  flush = false,
  wide = false,
  unreadMessages = 0,
}: Props) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserNav | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number; width: number } | null>(
    null
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) {
        if (!cancelled) {
          setUser(null)
          setIsAdmin(false)
        }
        return
      }
      const [{ data: row }, adminRes] = await Promise.all([
        supabase.from('users').select('name, avatar_url').eq('id', authUser.id).maybeSingle(),
        fetch('/api/admin/me')
          .then(r => r.json() as Promise<{ isAdmin?: boolean }>)
          .catch(() => ({ isAdmin: false })),
      ])
      if (!cancelled) {
        setUser({
          name: row?.name ?? authUser.user_metadata?.full_name ?? null,
          avatarUrl: row?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
        })
        setIsAdmin(!!adminRes.isAdmin)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuStyle(null)
      return
    }
    function position() {
      const btn = buttonRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const width = Math.min(280, window.innerWidth - 16)
      const preferredRight = window.innerWidth - rect.right
      const right = Math.min(Math.max(8, preferredRight), window.innerWidth - width - 8)
      setMenuStyle({ top: rect.bottom + 8, right, width })
    }
    position()
    window.addEventListener('resize', position)
    return () => window.removeEventListener('resize', position)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    function onDoc(e: MouseEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const initial = (user?.name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className={siteChromePad}>
          <div
            className={cn(
              'grid grid-cols-[1fr_auto_1fr] items-center gap-4',
              siteHeaderHeight
            )}
          >
            <div className="flex items-center justify-self-start">
              <Link href="/" className={siteLogoClass}>
                FESTEN.
              </Link>
            </div>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Talangdashboard">
              {NAV.map(item => {
                const active = item.match(pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm transition-colors',
                      active
                        ? 'font-semibold text-foreground'
                        : 'font-medium text-foreground hover:text-muted-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 border-b-2 pb-1',
                        active ? 'border-foreground' : 'border-transparent'
                      )}
                    >
                      {item.label}
                      {item.href === '/dashboard/messages' && unreadMessages > 0 && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {unreadMessages}
                        </span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <Button
                asChild
                variant="ghost"
                size="pill"
                className="hidden h-auto sm:inline-flex px-4 py-2.5 text-sm font-medium text-foreground"
              >
                <Link href="/planner/dashboard">Byt till planerarläge</Link>
              </Button>

              <Button
                ref={buttonRef}
                type="button"
                variant="outline"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Huvudmeny"
                onClick={() => setMenuOpen(v => !v)}
                className={cn(
                  'h-10 gap-2 rounded-full border-border bg-background pl-3 pr-1.5 shadow-none hover:bg-background hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]',
                  menuOpen && 'shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
                )}
              >
                <Menu className="size-4 shrink-0 text-foreground" strokeWidth={2} aria-hidden />
                {user?.avatarUrl ? (
                  <span className="relative h-8 w-8 overflow-hidden rounded-full bg-muted flex-shrink-0">
                    <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background flex-shrink-0">
                    {initial}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          className="flex gap-2 overflow-x-auto border-t border-[#ebebeb] px-4 py-2 scrollbar-hide md:hidden"
          aria-label="Talangdashboard"
        >
          {NAV.map(item => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[13px]',
                  active
                    ? 'bg-[#222222] font-semibold text-white'
                    : 'font-medium text-[#222222] hover:bg-[#f7f7f7]'
                )}
              >
                {item.label}
                {item.href === '/dashboard/messages' && unreadMessages > 0
                  ? ` (${unreadMessages})`
                  : ''}
              </Link>
            )
          })}
        </nav>
      </header>

      {menuOpen && menuStyle && (
        <div
          role="menu"
          ref={menuRef}
          style={{ top: menuStyle.top, right: menuStyle.right, width: menuStyle.width }}
          className="fixed z-[60] rounded-2xl border border-[#dddddd] bg-white py-2 shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
        >
          <Link
            href="/dashboard/profile"
            className={menuItemClass}
            onClick={() => setMenuOpen(false)}
          >
            <MenuIcon icon={User} />
            Min profil
          </Link>
          <Link
            href="/dashboard/requests"
            className={menuItemClass}
            onClick={() => setMenuOpen(false)}
          >
            <MenuIcon icon={Calendar} />
            Förfrågningar
          </Link>
          <Link
            href="/dashboard/reviews"
            className={menuItemClass}
            onClick={() => setMenuOpen(false)}
          >
            <MenuIcon icon={Star} />
            Recensioner
          </Link>
          <Link
            href="/dashboard/account"
            className={menuItemClass}
            onClick={() => setMenuOpen(false)}
          >
            <MenuIcon icon={Settings} />
            Inställningar
          </Link>
          <Separator className="my-2" />
          <Link
            href="/planner/dashboard"
            className={menuItemClass}
            onClick={() => setMenuOpen(false)}
          >
            <MenuIcon icon={ArrowLeftRight} />
            Byt till planerarläge
          </Link>
          <Link href="/hjalp" className={menuItemClass} onClick={() => setMenuOpen(false)}>
            <MenuIcon icon={CircleHelp} />
            Hjälpcenter
          </Link>
          {isAdmin ? (
            <>
              <Separator className="my-2" />
              <Link href="/admin" className={menuItemClass} onClick={() => setMenuOpen(false)}>
                <MenuIcon icon={Shield} />
                Admin
              </Link>
            </>
          ) : null}
          <Separator className="my-2" />
          <form action="/auth/signout" method="post">
            <button type="submit" className={menuItemClass}>
              <MenuIcon icon={LogOut} />
              Logga ut
            </button>
          </form>
        </div>
      )}

      {flush ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      ) : wide ? (
        <main className={cn(siteChromePad, 'w-full flex-1 py-8 sm:py-12')}>{children}</main>
      ) : (
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-10 sm:py-12">
          {children}
        </main>
      )}
    </div>
  )
}
