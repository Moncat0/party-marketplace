import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AuthIntent } from './auth-intent'

type EnsureUserOptions = {
  intent?: AuthIntent | null
  signupSource?: string
  referrerId?: string | null
}

/**
 * Ensure a public.users row exists for the authenticated auth.users id.
 * Returns whether a new row was created.
 */
export async function ensureAppUser(
  supabase: SupabaseClient,
  user: User,
  opts: EnsureUserOptions = {}
): Promise<{ created: boolean; error: string | null }> {
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    console.error('[ensureAppUser] select failed:', selectError.message)
    return { created: false, error: selectError.message }
  }

  if (existingUser) {
    return { created: false, error: null }
  }

  const userType = opts.intent === 'provider' ? 'provider' : 'planner'
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
    // Race: another request may have inserted concurrently
    if (insertError.code === '23505') {
      return { created: false, error: null }
    }
    console.error('[ensureAppUser] insert failed:', insertError.message)
    return { created: false, error: insertError.message }
  }

  return { created: true, error: null }
}
