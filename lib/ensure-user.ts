import type { SupabaseClient, User } from '@supabase/supabase-js'
import { parseAuthIntent, type AuthIntent } from './auth-intent'

type EnsureUserOptions = {
  intent?: AuthIntent | null
  signupSource?: string
  referrerId?: string | null
}

type AppUserType = 'planner' | 'provider' | 'both'

/** Intent stored on auth.users metadata so magic-link / OAuth survives cookie expiry. */
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
    // current === planner
    const { count } = await supabase
      .from('booking_requests')
      .select('*', { count: 'exact', head: true })
      .eq('planner_id', userId)
    return (count ?? 0) > 0 ? 'both' : 'provider'
  }

  // intent === planner
  if (current === 'planner') return current
  // current === provider → unlock demand side
  return 'both'
}

/**
 * Ensure a public.users row exists for the authenticated auth.users id.
 * Applies / upgrades user_type from auth intent when present.
 */
export async function ensureAppUser(
  supabase: SupabaseClient,
  user: User,
  opts: EnsureUserOptions = {}
): Promise<{ created: boolean; error: string | null }> {
  const intent =
    opts.intent ?? intentFromUserMetadata(user)

  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    console.error('[ensureAppUser] select failed:', selectError.message)
    return { created: false, error: selectError.message }
  }

  if (existingUser) {
    const current = (existingUser.user_type as AppUserType) ?? 'planner'
    const next = await mergeUserType(supabase, user.id, current, intent)
    if (next !== current) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ user_type: next })
        .eq('id', user.id)
      if (updateError) {
        console.error('[ensureAppUser] role update failed:', updateError.message)
        return { created: false, error: updateError.message }
      }
    }
    return { created: false, error: null }
  }

  const userType = userTypeForNewAccount(intent)
  const provider = (user.app_metadata?.provider as string | undefined) ?? 'email'

  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    user_type: userType,
    auth_provider: provider,
    signup_source: opts.signupSource ?? 'organic',
    referrer_id: opts.referrerId ?? null,
  })

  if (insertError) {
    // Race: another request may have inserted concurrently — still apply intent
    if (insertError.code === '23505') {
      const { data: raced } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle()
      if (raced) {
        const current = (raced.user_type as AppUserType) ?? 'planner'
        const next = await mergeUserType(supabase, user.id, current, intent)
        if (next !== current) {
          await supabase.from('users').update({ user_type: next }).eq('id', user.id)
        }
      }
      return { created: false, error: null }
    }
    console.error('[ensureAppUser] insert failed:', insertError.message)
    return { created: false, error: insertError.message }
  }

  return { created: true, error: null }
}
