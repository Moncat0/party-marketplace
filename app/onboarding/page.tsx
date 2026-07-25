import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import OnboardingFlow from './OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?intent=provider&next=/onboarding')
  }

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profile?.is_published) {
    redirect('/dashboard')
  }

  return <OnboardingFlow userId={user.id} existingProfile={profile ?? null} />
}
