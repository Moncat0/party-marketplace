'use client'

import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { siteChromePad, siteHeaderRow, siteLogoClass } from '@/components/siteChrome'
import { openAuth } from '@/lib/open-auth'
import {
  Calendar,
  CircleHelp,
  Heart,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  User,
} from 'lucide-react'

export type NavMode = 'planner' | 'provider'

type UserNav = {
  id: string
  name: string | null
  avatarUrl: string | null
  hasProviderProfile: boolean
}

type Props = {
  /** Search bar or other center content (homepage) */
  center?: ReactNode
  /**
   * Filters stacked under the search pill (results page).
   * Rendered in the same header — not a separate full-width bar.
   */
  subnav?: ReactNode
  /**
   * Results page: little search expanded to the homepage-size pill.
   * Grows the chrome to match (don't stay on the compact h-12 row).
   */
  searchExpanded?: boolean
  /** Current marketplace context — drives CTA + avatar destination */
  currentMode?: NavMode
  /** Extra actions before the menu (e.g. Share / Save on profiles) */
  actions?: ReactNode
  className?: string
  scrolled?: boolean
}

const menuItemClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-accent transition-colors'

function MenuIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="size-[18px] shrink-0 text-foreground" strokeWidth={2} aria-hidden />
}

export default function MarketplaceHeader({
  center,
  subnav,
  searchExpanded = false,
  currentMode = 'planner',
  actions,
  className = '',
  scrolled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserNav | null | undefined>(undefined) // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number; width: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        if (!cancelled) {
          setUser(null)
          setIsAdmin(false)
        }
        return
      }
      const [{ data: row }, { data: profile }, adminRes] = await Promise.all([
        supabase.from('users').select('name, avatar_url').eq('id', authUser.id).maybeSingle(),
        supabase.from('provider_profiles').select('id').eq('user_id', authUser.id).maybeSingle(),
        fetch('/api/admin/me').then(r => r.json() as Promise<{ isAdmin?: boolean }>).catch(() => ({ isAdmin: false })),
      ])
      if (!cancelled) {
        setUser({
          id: authUser.id,
          name: row?.name ?? authUser.user_metadata?.full_name ?? null,
          avatarUrl: row?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
          hasProviderProfile: !!profile,
        })
        setIsAdmin(!!adminRes.isAdmin)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useLayoutEffect(() => {
    function positionMenu() {
      const btn = buttonRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const width = Math.min(280, window.innerWidth - 16)
      const preferredRight = window.innerWidth - rect.right
      const right = Math.min(Math.max(8, preferredRight), window.innerWidth - width - 8)
      setMenuStyle({
        top: rect.bottom + 8,
        right,
        width,
      })
    }

    if (!open) {
      setMenuStyle(null)
      return
    }

    positionMenu()
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    return () => {
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
    }
  }, [open])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initial = (user?.name ?? '?').charAt(0).toUpperCase()

  const switchCta = (() => {
    if (!user) {
      return {
        onClick: () => openAuth({ intent: 'provider', next: '/onboarding', mode: 'signup' }),
        label: 'Erbjud din tjänst',
      } as const
    }
    if (currentMode === 'planner') {
      return user.hasProviderProfile
        ? ({ href: '/dashboard', label: 'Byt till talangläge' } as const)
        : ({ href: '/onboarding', label: 'Erbjud din tjänst' } as const)
    }
    return { href: '/planner/dashboard', label: 'Byt till planerarläge' } as const
  })()

  const menuButton = (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label="Huvudmeny"
      onClick={() => setOpen(v => !v)}
      className={cn(
        'h-10 gap-2 rounded-full border-border bg-background pl-3 pr-1.5 shadow-none hover:bg-background hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]',
        open && 'shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
      )}
    >
      <Menu className="size-4 shrink-0 text-foreground" strokeWidth={2} aria-hidden />
      {user ? (
        user.avatarUrl ? (
          <span className="relative h-8 w-8 overflow-hidden rounded-full bg-muted flex-shrink-0">
            <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background flex-shrink-0">
            {initial}
          </span>
        )
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground text-background flex-shrink-0">
          <User className="size-4" strokeWidth={2} aria-hidden fill="currentColor" />
        </span>
      )}
    </Button>
  )

  const rightChrome = (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      {actions}
      {'onClick' in switchCta ? (
        <Button
          type="button"
          variant="ghost"
          size="pill"
          className="hidden h-auto sm:inline-flex px-4 py-2.5 text-sm font-medium text-foreground"
          onClick={switchCta.onClick}
        >
          {switchCta.label}
        </Button>
      ) : (
        <Button
          asChild
          variant="ghost"
          size="pill"
          className="hidden h-auto sm:inline-flex px-4 py-2.5 text-sm font-medium text-foreground"
        >
          <Link href={switchCta.href}>{switchCta.label}</Link>
        </Button>
      )}
      {menuButton}
    </div>
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-background transition-shadow duration-200',
        scrolled
          ? 'shadow-[0_1px_2px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]'
          : 'border-b border-border',
        className
      )}
    >
      {/*
        Live Airbnb: header is full-viewport width (only explore padding), not
        clamped to the content max-width. That gives the optically centered
        search room so it doesn't collide with logo / right chrome.
      */}
      <div className={siteChromePad}>
        {subnav ? (
          /*
            Results header (Airbnb): one chrome block.
            Mobile: stack logo/menu, then full-width search+filters.
            Desktop: 1fr | auto | 1fr keeps search+filters as a compact centered unit.
          */
          <div
            className={cn(
              'flex flex-col gap-2 py-2.5 transition-[padding,min-height] duration-300 ease-[cubic-bezier(0.2,0,0,1)] md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-3 md:gap-y-0',
              searchExpanded
                ? 'md:items-center md:py-4 md:min-h-20 min-[1440px]:md:min-h-24'
                : 'md:items-start'
            )}
          >
            <div
              className={cn(
                'flex h-12 items-center justify-between md:justify-start',
                searchExpanded && 'md:min-h-16'
              )}
            >
              <Link href="/" className={siteLogoClass}>
                FESTEN.
              </Link>
              <div className="md:hidden">{rightChrome}</div>
            </div>

            <div className="flex w-full min-w-0 flex-col items-stretch gap-2 md:max-w-[min(100vw-2rem,840px)] md:items-center">
              {center}
              {subnav}
            </div>

            <div
              className={cn(
                'hidden items-center justify-end md:flex',
                searchExpanded ? 'md:min-h-16' : 'h-12'
              )}
            >
              {rightChrome}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: logo row, then full-width search so it never sits under chrome */}
            <div className="flex flex-col gap-2 py-2.5 md:hidden">
              <div className="flex h-12 items-center justify-between">
                <Link href="/" className={siteLogoClass}>
                  FESTEN.
                </Link>
                {rightChrome}
              </div>
              {center ? <div className="w-full min-w-0">{center}</div> : null}
            </div>

            {/* Desktop: optically centered search between logo and menu */}
            <div
              className={cn(siteHeaderRow, 'hidden md:flex')}
              style={{
                transition: 'height 280ms cubic-bezier(0.2, 0, 0, 1)',
              }}
            >
              <div className="relative z-[2] flex-shrink-0 bg-background">
                <Link href="/" className={siteLogoClass}>
                  FESTEN.
                </Link>
              </div>

              {center && (
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                  <div className="pointer-events-auto flex w-full max-w-[850px] justify-center px-2">
                    {center}
                  </div>
                </div>
              )}

              <div className="relative z-[2] ml-auto flex-shrink-0 bg-background">{rightChrome}</div>
            </div>
          </>
        )}

        {open && menuStyle && (
          <div
            role="menu"
            ref={menuRef}
            style={{ top: menuStyle.top, right: menuStyle.right, width: menuStyle.width }}
            className="fixed z-[60] rounded-2xl border border-border bg-background py-2 shadow-[0_2px_16px_rgba(0,0,0,0.12)]"
          >
            {!user ? (
              <>
                <Link
                  href="/hjalp"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={CircleHelp} />
                  Hjälpcenter
                </Link>

                <Separator className="my-2" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    openAuth({ intent: 'provider', next: '/onboarding', mode: 'signup' })
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Erbjud din tjänst</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      Det är enkelt att komma igång och nå fler kunder.
                    </p>
                  </div>
                  <span className="text-3xl flex-shrink-0" aria-hidden>
                    🎤
                  </span>
                </button>

                <Separator className="my-2" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    openAuth({ intent: 'planner', next: '/', mode: 'login' })
                  }}
                  className={menuItemClass}
                >
                  Logga in eller skapa konto
                </button>
              </>
            ) : currentMode === 'planner' ? (
              <>
                <Link
                  href="/planner/shortlist"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={Heart} />
                  Önskelistor
                </Link>
                <Link
                  href="/planner/bookings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={Calendar} />
                  Bokningar
                </Link>
                <Link
                  href="/planner/messages"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={MessageSquare} />
                  Meddelanden
                </Link>
                <Link
                  href="/planner/dashboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={LayoutDashboard} />
                  Översikt
                </Link>

                <Separator className="my-2" />

                <Link
                  href="/planner/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={Settings} />
                  Kontoinställningar
                </Link>
                <Link
                  href="/hjalp"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={CircleHelp} />
                  Hjälpcenter
                </Link>

                {isAdmin ? (
                  <>
                    <Separator className="my-2" />
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={menuItemClass}
                    >
                      <MenuIcon icon={Shield} />
                      Admin
                    </Link>
                  </>
                ) : null}

                {!user.hasProviderProfile && (
                  <>
                    <Separator className="my-2" />
                    <Link
                      href="/onboarding"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Erbjud din tjänst</p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          Det är enkelt att komma igång och nå fler kunder.
                        </p>
                      </div>
                      <span className="text-3xl flex-shrink-0" aria-hidden>
                        🎤
                      </span>
                    </Link>
                  </>
                )}

                <Separator className="my-2" />
                <form action="/auth/signout" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    role="menuitem"
                    className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <MenuIcon icon={LogOut} />
                    Logga ut
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/requests"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={Calendar} />
                  Förfrågningar
                </Link>
                <Link
                  href="/dashboard/messages"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={MessageSquare} />
                  Meddelanden
                </Link>
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={User} />
                  Min profil
                </Link>
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={LayoutDashboard} />
                  Översikt
                </Link>

                <Separator className="my-2" />

                <Link
                  href="/dashboard/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={Settings} />
                  Kontoinställningar
                </Link>
                <Link
                  href="/hjalp"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon icon={CircleHelp} />
                  Hjälpcenter
                </Link>

                {isAdmin ? (
                  <>
                    <Separator className="my-2" />
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={menuItemClass}
                    >
                      <MenuIcon icon={Shield} />
                      Admin
                    </Link>
                  </>
                ) : null}

                <Separator className="my-2" />
                <form action="/auth/signout" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    role="menuitem"
                    className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <MenuIcon icon={LogOut} />
                    Logga ut
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
