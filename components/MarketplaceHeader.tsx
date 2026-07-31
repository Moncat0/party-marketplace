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

function HelpIcon() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  )
}

function MenuIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
      <path d={d} />
    </svg>
  )
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
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number; width: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        if (!cancelled) setUser(null)
        return
      }
      const [{ data: row }, { data: profile }] = await Promise.all([
        supabase.from('users').select('name, avatar_url').eq('id', authUser.id).maybeSingle(),
        supabase.from('provider_profiles').select('id').eq('user_id', authUser.id).maybeSingle(),
      ])
      if (!cancelled) {
        setUser({
          id: authUser.id,
          name: row?.name ?? authUser.user_metadata?.full_name ?? null,
          avatarUrl: row?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
          hasProviderProfile: !!profile,
        })
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-foreground">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
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
            1fr | auto | 1fr keeps search+filters as a compact centered unit —
            not a full-bleed second strip under the top row.
            When search expands to the homepage pill, grow to homepage row height
            so the nav doesn't stay (or shrink further) on the compact strip.
          */
          <div
            className={cn(
              'grid grid-cols-[1fr_auto_1fr] gap-x-3 transition-[padding,min-height] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
              searchExpanded
                ? 'items-center py-4 min-h-20 min-[1440px]:min-h-24'
                : 'items-start py-2.5'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-start',
                searchExpanded ? 'min-h-16' : 'h-12'
              )}
            >
              <Link href="/" className={siteLogoClass}>
                FESTEN.
              </Link>
            </div>

            <div className="flex min-w-0 max-w-[min(100vw-2rem,840px)] flex-col items-center gap-2">
              {center}
              {subnav}
            </div>

            <div
              className={cn(
                'flex items-center justify-end',
                searchExpanded ? 'min-h-16' : 'h-12'
              )}
            >
              {rightChrome}
            </div>
          </div>
        ) : (
          <div
            className={siteHeaderRow}
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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
                <div className="pointer-events-auto w-full max-w-[850px] flex justify-center px-2">
                  {center}
                </div>
              </div>
            )}

            <div className="relative z-[2] ml-auto flex-shrink-0 bg-background">{rightChrome}</div>
          </div>
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
                  <HelpIcon />
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
                  <MenuIcon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  Önskelistor
                </Link>
                <Link
                  href="/planner/bookings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  Bokningar
                </Link>
                <Link
                  href="/planner/messages"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  Meddelanden
                </Link>
                <Link
                  href="/planner/dashboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  Översikt
                </Link>

                <Separator className="my-2" />

                <Link
                  href="/planner/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  Kontoinställningar
                </Link>
                <Link
                  href="/hjalp"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <HelpIcon />
                  Hjälpcenter
                </Link>

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
                    className="h-auto w-full justify-start rounded-none px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                  >
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
                  <MenuIcon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  Förfrågningar
                </Link>
                <Link
                  href="/dashboard/messages"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  Meddelanden
                </Link>
                <Link
                  href="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  Min profil
                </Link>
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  Översikt
                </Link>

                <Separator className="my-2" />

                <Link
                  href="/dashboard/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <MenuIcon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  Kontoinställningar
                </Link>
                <Link
                  href="/hjalp"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <HelpIcon />
                  Hjälpcenter
                </Link>

                <Separator className="my-2" />
                <form action="/auth/signout" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    role="menuitem"
                    className="h-auto w-full justify-start rounded-none px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                  >
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
