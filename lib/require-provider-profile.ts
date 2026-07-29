import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * When a provider dashboard page has no provider_profiles row:
 * - user_type provider|both → continue onboarding
 * - otherwise (planner) → planner home
 */
export async function redirectWithoutProviderProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<never> {
  const { data: userData } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle()

  const type = userData?.user_type
  if (type === 'provider' || type === 'both') {
    redirect('/onboarding')
  }
  redirect('/')
}
