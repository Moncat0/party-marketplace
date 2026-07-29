/**
 * Soft profile-completion checks — used by post-auth redirect and booking gate.
 */

export type DisplayNameFields = {
  name?: string | null
  first_name?: string | null
}

export type PhoneFields = {
  phone?: string | null
}

/**
 * Require a structured first name (not only OAuth full_name).
 * Prefill welcome from `name` when first_name is missing.
 */
export function needsDisplayName(
  user: DisplayNameFields | null | undefined
): boolean {
  if (!user) return true
  return !(user.first_name ?? '').trim()
}

export function needsPhone(user: PhoneFields | null | undefined): boolean {
  if (!user) return true
  return !(user.phone ?? '').trim()
}

export function buildDisplayName(firstName: string, lastName = ''): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
}

function safePath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  if (raw === '/welcome' || raw.startsWith('/welcome?')) return null
  return raw
}

/** Send incomplete profiles through /welcome, preserving the real destination. */
export function welcomeUrl(next: string | null | undefined): string {
  const dest = safePath(next)
  if (!dest) return '/welcome'
  return `/welcome?next=${encodeURIComponent(dest)}`
}

export function parseWelcomeNext(raw: string | null | undefined): string | null {
  return safePath(raw)
}

/** True when post-auth destination is supply-side (provider onboarding / host dashboard). */
export function isProviderDestination(next: string | null | undefined): boolean {
  const path = safePath(next)
  if (!path) return false
  return (
    path === '/onboarding' ||
    path.startsWith('/onboarding/') ||
    path.startsWith('/onboarding?') ||
    path === '/dashboard' ||
    path.startsWith('/dashboard/')
  )
}
