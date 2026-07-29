import type { User } from '@supabase/supabase-js'

/** User metadata key — set when the user creates a password (signup gate or settings). */
export const PASSWORD_SET_METADATA_KEY = 'password_set'

/**
 * Email/magic-link accounts must set a password before using the app.
 * Google / Apple identities skip this gate.
 */
export function needsPasswordSetup(user: User | null | undefined): boolean {
  if (!user) return false

  const identities = user.identities ?? []
  const hasOAuth = identities.some(
    i => i.provider === 'google' || i.provider === 'apple'
  )
  if (hasOAuth) return false

  if (user.user_metadata?.[PASSWORD_SET_METADATA_KEY] === true) return false

  // Email identity (magic link / password) without password_set flag
  return true
}

export function setPasswordUrl(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/set-password'
  }
  if (next === '/set-password' || next.startsWith('/set-password?')) {
    return '/set-password'
  }
  return `/set-password?next=${encodeURIComponent(next)}`
}

export function parseSetPasswordNext(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  if (raw === '/set-password' || raw.startsWith('/set-password?')) return null
  return raw
}
