/** Auth entry intent — planner (demand) vs provider (supply). */

import { welcomeUrl } from '@/lib/profile-completeness'
import { isPlannerDiscoveryNext } from '@/lib/planner-search-wizard'
import { setPasswordUrl } from '@/lib/auth-password'

export type AuthIntent = 'planner' | 'provider'

export const INTENT_COOKIE = 'festen_intent'
/** Long enough for email confirmation clicks (was 10 minutes — too short). */
export const INTENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function parseAuthIntent(value: string | null | undefined): AuthIntent | null {
  if (value === 'planner' || value === 'provider') return value
  return null
}

/**
 * Soft auth entry — opens the global auth modal on the homepage via ?auth=1.
 * Prefer `openAuth()` on the client when the user is already on a page.
 */
export function authEntryUrl(opts: {
  intent?: AuthIntent
  next?: string
}): string {
  const params = new URLSearchParams()
  params.set('auth', '1')
  if (opts.intent) params.set('intent', opts.intent)
  if (opts.next) params.set('next', opts.next)
  return `/?${params.toString()}`
}

/** @deprecated alias — kept so existing call sites open the modal instead of a full-page wall. */
export function signupUrl(opts: {
  intent?: AuthIntent
  next?: string
}): string {
  return authEntryUrl(opts)
}

function safePath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

function isProviderPath(path: string): boolean {
  return (
    path === '/onboarding' ||
    path.startsWith('/onboarding/') ||
    path.startsWith('/onboarding?') ||
    path === '/dashboard' ||
    path.startsWith('/dashboard/')
  )
}

/**
 * Resolve where to send the user after auth.
 * Provider intent → onboarding flow (name+bio live inside that wizard).
 * Planner missing name → /welcome (discovery or soft-gate name).
 * Planner cold login with name → homepage.
 * Email users without a password → /set-password first (preserves destination).
 */
export function resolvePostAuthDestination(opts: {
  intent: AuthIntent | null
  next: string | null
  /** True when user already has a provider_profiles row */
  hasProviderProfile?: boolean
  /** True when that profile is published */
  isPublished?: boolean
  /** True when first_name is empty */
  needsDisplayName?: boolean
  /** True when email user must create a password */
  needsPasswordSetup?: boolean
}): string {
  const next = safePath(opts.next)

  // Explicit deep links (soft gate return, booking, etc.) always win
  const isGenericNext =
    !next ||
    next === '/' ||
    next === '/dashboard' ||
    next === '/planner/dashboard' ||
    next === '/onboarding' ||
    next.startsWith('/onboarding?') ||
    next === '/welcome' ||
    next.startsWith('/welcome?') ||
    next === '/set-password' ||
    next.startsWith('/set-password?')

  let destination: string

  if (opts.isPublished && isGenericNext) {
    destination = '/dashboard'
  } else if (opts.hasProviderProfile && !opts.isPublished && isGenericNext) {
    destination = '/onboarding'
  } else if (opts.intent === 'provider') {
    destination =
      next === '/onboarding' ||
      next?.startsWith('/onboarding?') ||
      next?.startsWith('/onboarding/')
        ? next
        : '/onboarding'
  } else if (next && !isGenericNext) {
    destination = next
  } else if (next === '/onboarding' || next?.startsWith('/onboarding?')) {
    destination = next
  } else {
    destination = '/'
  }

  // Password gate first (email/magic signup) — before welcome or onboarding
  if (opts.needsPasswordSetup) {
    return setPasswordUrl(destination)
  }

  // Providers collect name/bio inside the listing wizard — never bounce through /welcome
  if (isProviderPath(destination)) {
    return destination
  }

  // Planners: missing name → welcome (full discovery if next is browse/sok)
  if (opts.needsDisplayName) {
    return welcomeUrl(destination)
  }

  if (isPlannerDiscoveryNext(destination) && opts.intent === 'planner') {
    return destination
  }

  return destination
}

/** Client-side: persist intent cookie so OAuth round-trip keeps it. */
export function setIntentCookie(intent: AuthIntent) {
  if (typeof document === 'undefined') return
  document.cookie = `${INTENT_COOKIE}=${intent}; path=/; max-age=${INTENT_COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearIntentCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${INTENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
