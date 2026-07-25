/** Auth entry intent — planner (demand) vs provider (supply). */

export type AuthIntent = 'planner' | 'provider'

export const INTENT_COOKIE = 'festen_intent'
export const INTENT_COOKIE_MAX_AGE = 60 * 10 // 10 minutes

export function parseAuthIntent(value: string | null | undefined): AuthIntent | null {
  if (value === 'planner' || value === 'provider') return value
  return null
}

/** Build /signup URL with explicit intent and optional return path. */
export function signupUrl(opts: {
  intent?: AuthIntent
  next?: string
}): string {
  const params = new URLSearchParams()
  if (opts.intent) params.set('intent', opts.intent)
  if (opts.next) params.set('next', opts.next)
  const qs = params.toString()
  return qs ? `/signup?${qs}` : '/signup'
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
 */
export function resolvePostAuthDestination(opts: {
  intent: AuthIntent | null
  next: string | null
  /** True when user already has a provider_profiles row */
  hasProviderProfile?: boolean
  /** True when that profile is published */
  isPublished?: boolean
}): string {
  const next = safePath(opts.next)

  // Explicit deep links (soft gate return, booking, etc.) always win
  const isGenericNext =
    !next ||
    next === '/' ||
    next === '/dashboard' ||
    next === '/planner/dashboard' ||
    next === '/onboarding' ||
    next.startsWith('/onboarding?')

  if (opts.isPublished && isGenericNext) {
    return '/dashboard'
  }

  // Existing draft profile + provider intent or generic next → resume onboarding
  if (opts.hasProviderProfile && !opts.isPublished && isGenericNext) {
    return '/onboarding'
  }

  if (opts.intent === 'provider') {
    if (next === '/onboarding' || next?.startsWith('/onboarding?')) return next
    return '/onboarding'
  }

  // Planner (or unknown): honour specific next, else planner home
  if (next && !isGenericNext) return next
  if (next === '/onboarding' || next?.startsWith('/onboarding?')) return '/onboarding'
  return '/planner/dashboard'
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
