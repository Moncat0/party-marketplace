import type { SupabaseClient, User } from '@supabase/supabase-js'
import { parseAuthIntent, type AuthIntent } from './auth-intent'
import {
  authEmailIsConfirmed,
  buildDisplayName,
  namesFromAuthUser,
  type SignupCompliancePayload,
} from './auth-compliance'

type EnsureUserOptions = {
  intent?: AuthIntent | null
  signupSource?: string
  referrerId?: string | null
  /** Names + terms + age captured in the auth modal before Google OAuth */
  modalCompliance?: SignupCompliancePayload | null
}

type AppUserType = 'planner' | 'provider' | 'both'

/** Intent stored on auth.users metadata so OAuth / confirm email survives cookie expiry. */
export const AUTH_INTENT_METADATA_KEY = 'festen_intent'

export function intentFromUserMetadata(user: User | null | undefined): AuthIntent | null {
  if (!user) return null
  const meta = user.user_metadata as Record<string, unknown> | undefined
  return parseAuthIntent(
    typeof meta?.[AUTH_INTENT_METADATA_KEY] === 'string'
      ? (meta[AUTH_INTENT_METADATA_KEY] as string)
      : null
  )
}

function metaTimestamp(
  meta: Record<string, unknown> | undefined,
  key: string
): string | null {
  const v = meta?.[key]
  if (typeof v === 'string' && v.trim()) return v
  if (v === true) return new Date().toISOString()
  return null
}

function userTypeForNewAccount(intent: AuthIntent | null | undefined): AppUserType {
  return intent === 'provider' ? 'provider' : 'planner'
}

/**
 * Merge an entry intent onto an existing role.
 * - Supply entry on a pure planner with no bookings → provider (fixes lost-intent race)
 * - Supply entry on a planner who already booked → both
 * - Demand entry on a pure provider → both
 */
async function mergeUserType(
  supabase: SupabaseClient,
  userId: string,
  current: AppUserType,
  intent: AuthIntent | null | undefined
): Promise<AppUserType> {
  if (!intent) return current
  if (current === 'both') return current

  if (intent === 'provider') {
    if (current === 'provider') return current
    const { count } = await supabase
      .from('booking_requests')
      .select('*', { count: 'exact', head: true })
      .eq('planner_id', userId)
    return (count ?? 0) > 0 ? 'both' : 'provider'
  }

  if (current === 'planner') return current
  return 'both'
}

function compliancePatchFromAuth(user: User): Record<string, unknown> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const names = namesFromAuthUser(user)
  const patch: Record<string, unknown> = {}

  if (authEmailIsConfirmed(user)) {
    patch.email_verified_at = user.email_confirmed_at ?? new Date().toISOString()
  } else if (user.phone_confirmed_at) {
    // Phone OTP confirmation counts as verified identity for publish gates
    patch.email_verified_at = user.phone_confirmed_at
  }

  if (user.phone) {
    patch.phone = user.phone
  }

  const termsAt = metaTimestamp(meta, 'terms_accepted_at')
  if (termsAt) patch.terms_accepted_at = termsAt

  const ageAt = metaTimestamp(meta, 'age_confirmed_at')
  if (ageAt) patch.age_confirmed_at = ageAt

  const first =
    (typeof meta.first_name === 'string' && meta.first_name.trim()) ||
    names.firstName ||
    ''
  const last =
    (typeof meta.last_name === 'string' && meta.last_name.trim()) ||
    names.lastName ||
    ''
  if (first) {
    patch.first_name = first
    patch.preferred_first_name = first
    patch.name = buildDisplayName(first, last)
  }
  if (last) patch.last_name = last

  return patch
}

/**
 * Ensure a public.users row exists for the authenticated auth.users id.
 * Syncs email verification + compliance fields from auth metadata.
 */
export async function ensureAppUser(
  supabase: SupabaseClient,
  user: User,
  opts: EnsureUserOptions = {}
): Promise<{ created: boolean; error: string | null }> {
  const intent = opts.intent ?? intentFromUserMetadata(user)
  const compliance = compliancePatchFromAuth(user)

  // Modal signup fields: always apply terms/age; names only when typed in the form
  if (opts.modalCompliance) {
    const m = opts.modalCompliance
    compliance.terms_accepted_at = m.terms_accepted_at
    compliance.age_confirmed_at = m.age_confirmed_at
    if (m.firstName) {
      compliance.first_name = m.firstName
      compliance.last_name = m.lastName || null
      compliance.preferred_first_name = m.firstName
      compliance.name = buildDisplayName(m.firstName, m.lastName)
    }
  }

  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select(
      'id, user_type, email_verified_at, terms_accepted_at, age_confirmed_at, first_name, last_name, phone'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    console.error('[ensureAppUser] select failed:', selectError.message)
    return { created: false, error: selectError.message }
  }

  if (existingUser) {
    const current = (existingUser.user_type as AppUserType) ?? 'planner'
    const next = await mergeUserType(supabase, user.id, current, intent)
    const update: Record<string, unknown> = {}
    if (next !== current) update.user_type = next

    // Only fill compliance fields when still empty (don't overwrite)
    if (!existingUser.email_verified_at && compliance.email_verified_at) {
      update.email_verified_at = compliance.email_verified_at
    }
    if (!existingUser.terms_accepted_at && compliance.terms_accepted_at) {
      update.terms_accepted_at = compliance.terms_accepted_at
    }
    if (!existingUser.age_confirmed_at && compliance.age_confirmed_at) {
      update.age_confirmed_at = compliance.age_confirmed_at
    }
    // Prefer modal names when provided (even if Google already filled first_name)
    if (opts.modalCompliance?.firstName) {
      update.first_name = compliance.first_name
      update.preferred_first_name = compliance.preferred_first_name
      update.name = compliance.name
      update.last_name = compliance.last_name ?? null
    } else if (!existingUser.first_name && compliance.first_name) {
      update.first_name = compliance.first_name
      update.preferred_first_name = compliance.preferred_first_name
      update.name = compliance.name
      if (compliance.last_name) update.last_name = compliance.last_name
    }
    if (!existingUser.phone && compliance.phone) {
      update.phone = compliance.phone
    }

    if (Object.keys(update).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(update)
        .eq('id', user.id)
      if (updateError) {
        console.error('[ensureAppUser] update failed:', updateError.message)
        return { created: false, error: updateError.message }
      }
    }
    return { created: false, error: null }
  }

  const userType = userTypeForNewAccount(intent)
  const provider = (user.app_metadata?.provider as string | undefined) ?? 'email'
  // public.users.email is NOT NULL — phone-only auth gets a stable placeholder
  const email =
    user.email ??
    (user.phone
      ? `${user.phone.replace(/\D/g, '')}@phone.festen.local`
      : `${user.id}@pending.festen.local`)

  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    email,
    phone: (compliance.phone as string | undefined) ?? user.phone ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    user_type: userType,
    auth_provider: provider === 'phone' ? 'email' : provider,
    signup_source: opts.signupSource ?? 'organic',
    referrer_id: opts.referrerId ?? null,
    name:
      (compliance.name as string | undefined) ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      null,
    first_name: (compliance.first_name as string | undefined) ?? null,
    last_name: (compliance.last_name as string | undefined) ?? null,
    preferred_first_name: (compliance.preferred_first_name as string | undefined) ?? null,
    email_verified_at: (compliance.email_verified_at as string | undefined) ?? null,
    terms_accepted_at: (compliance.terms_accepted_at as string | undefined) ?? null,
    age_confirmed_at: (compliance.age_confirmed_at as string | undefined) ?? null,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raced } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle()
      if (raced) {
        const current = (raced.user_type as AppUserType) ?? 'planner'
        const nextType = await mergeUserType(supabase, user.id, current, intent)
        if (nextType !== current) {
          await supabase.from('users').update({ user_type: nextType }).eq('id', user.id)
        }
      }
      return { created: false, error: null }
    }
    console.error('[ensureAppUser] insert failed:', insertError.message)
    return { created: false, error: insertError.message }
  }

  return { created: true, error: null }
}
