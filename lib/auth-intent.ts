/** Auth entry intent — planner (demand) vs provider (supply). */

import { welcomeUrl } from '@/lib/profile-completeness'

export type AuthIntent = 'planner' | 'provider'

export const INTENT_COOKIE = 'festen_intent'
export const INTENT_COOKIE_MAX_AGE = 60 * 10 // 10 minutes

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

/**
 * Resolve where to send the user after auth.
 * Provider intent → onboarding (unless next is already onboarding-safe).
 * Planner → honour next, else planner dashboard.
 * Existing published providers → /dashboard when next is generic.
 * Missing display name → /welcome first (preserves the real destination).
 */
export function resolvePostAuthDestination(opts: {
  intent: AuthIntent | null
  next: string | null
  /** True when user already has a provider_profiles row */
  hasProviderProfile?: boolean
  /** True when that profile is published */
  isPublished?: boolean
  /** True when name / first_name are both empty */
  needsDisplayName?: boolean
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
    next.startsWith('/welcome?')

  let destination: string

  if (opts.isPublished && isGenericNext) {
    destination = '/dashboard'
  } else if (opts.hasProviderProfile && !opts.isPublished && isGenericNext) {
    // Existing draft profile + provider intent or generic next → resume onboarding
    destination = '/onboarding'
  } else if (opts.intent === 'provider') {
    destination =
      next === '/onboarding' || next?.startsWith('/onboarding?')
        ? next
        : '/onboarding'
  } else if (next && !isGenericNext) {
    // Planner (or unknown): honour specific next, else planner home
    destination = next
  } else if (next === '/onboarding' || next?.startsWith('/onboarding?')) {
    destination = next
  } else {
    destination = '/planner/dashboard'
  }

  if (opts.needsDisplayName) {
    return welcomeUrl(destination)
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
