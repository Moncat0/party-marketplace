/** Password metadata helpers — kept for settings / legacy accounts. */

import type { User } from '@supabase/supabase-js'

/** User metadata key — set when the user creates a password. */
export const PASSWORD_SET_METADATA_KEY = 'password_set'

/**
 * @deprecated Magic-link signup removed. Email users set a password at signup.
 * Always returns false so post-auth no longer redirects to /set-password.
 */
export function needsPasswordSetup(_user: User | null | undefined): boolean {
  return false
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
