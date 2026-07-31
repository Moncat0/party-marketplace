import type { User } from '@supabase/supabase-js'
import { buildDisplayName } from '@/lib/profile-completeness'

/** Password rules for email signup / reset. */
export const PASSWORD_MIN_LENGTH = 8

export type PasswordChecks = {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUpper: /[A-ZÅÄÖ]/.test(password),
    hasLower: /[a-zåäö]/.test(password),
    hasNumber: /\d/.test(password),
  }
}

export function isPasswordValid(password: string): boolean {
  const c = getPasswordChecks(password)
  return c.minLength && c.hasUpper && c.hasLower && c.hasNumber
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password.length > 0 && password === confirm
}

export type AppUserCompliance = {
  email_verified_at?: string | null
  terms_accepted_at?: string | null
  age_confirmed_at?: string | null
  first_name?: string | null
  last_name?: string | null
  name?: string | null
}

export function isEmailVerified(row: AppUserCompliance | null | undefined): boolean {
  return !!row?.email_verified_at
}

export function needsTermsAndAge(row: AppUserCompliance | null | undefined): boolean {
  return !row?.terms_accepted_at || !row?.age_confirmed_at
}

/** Cookie bridging modal signup fields across Google OAuth redirect. */
export const SIGNUP_COMPLIANCE_COOKIE = 'festen_signup'
export const SIGNUP_COMPLIANCE_MAX_AGE = 60 * 10 // 10 minutes

export type SignupCompliancePayload = {
  firstName: string
  lastName: string
  terms_accepted_at: string
  age_confirmed_at: string
}

export function setSignupComplianceCookie(payload: SignupCompliancePayload) {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(JSON.stringify(payload))
  document.cookie = `${SIGNUP_COMPLIANCE_COOKIE}=${value}; path=/; max-age=${SIGNUP_COMPLIANCE_MAX_AGE}; SameSite=Lax`
}

export function clearSignupComplianceCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${SIGNUP_COMPLIANCE_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function parseSignupComplianceCookie(
  raw: string | null | undefined
): SignupCompliancePayload | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<SignupCompliancePayload>
    if (
      typeof parsed.terms_accepted_at !== 'string' ||
      typeof parsed.age_confirmed_at !== 'string'
    ) {
      return null
    }
    return {
      firstName: typeof parsed.firstName === 'string' ? parsed.firstName.trim() : '',
      lastName: typeof parsed.lastName === 'string' ? parsed.lastName.trim() : '',
      terms_accepted_at: parsed.terms_accepted_at,
      age_confirmed_at: parsed.age_confirmed_at,
    }
  } catch {
    return null
  }
}

/** True when Supabase Auth considers the email confirmed (or OAuth Google). */
export function authEmailIsConfirmed(user: User | null | undefined): boolean {
  if (!user) return false
  if (user.email_confirmed_at) return true
  const identities = user.identities ?? []
  return identities.some(i => i.provider === 'google')
}

export function completeSignupUrl(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/complete-signup'
  }
  if (next === '/complete-signup' || next.startsWith('/complete-signup?')) {
    return '/complete-signup'
  }
  return `/complete-signup?next=${encodeURIComponent(next)}`
}

export function parseCompleteSignupNext(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  if (raw === '/complete-signup' || raw.startsWith('/complete-signup?')) return null
  return raw
}

export function namesFromAuthUser(user: User): { firstName: string; lastName: string } {
  const meta = user.user_metadata ?? {}
  const given =
    (typeof meta.given_name === 'string' && meta.given_name) ||
    (typeof meta.first_name === 'string' && meta.first_name) ||
    ''
  const family =
    (typeof meta.family_name === 'string' && meta.family_name) ||
    (typeof meta.last_name === 'string' && meta.last_name) ||
    ''
  if (given || family) {
    return { firstName: given.trim(), lastName: family.trim() }
  }
  const full =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    ''
  const parts = full.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

export { buildDisplayName }
