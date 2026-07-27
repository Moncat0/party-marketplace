import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import EditProfileForm from './EditProfileForm'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { ensureProviderAndService, getServiceForProvider } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Redigera tjänst' }

export default async function EditProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const { data: existingProvider } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingProvider) return await redirectWithoutProviderProfile(supabase, user.id)

  let service = await getServiceForProvider(supabase, existingProvider.id)
  if (!service) {
    const result = await ensureProviderAndService(supabase, user.id)
    if (result.error) return await redirectWithoutProviderProfile(supabase, user.id)
    service = await getServiceForProvider(supabase, result.providerId)
  }

  if (!service) return await redirectWithoutProviderProfile(supabase, user.id)

  return (
    <ProviderHostShell>
      <EditProfileForm service={service} userId={user.id} />
    </ProviderHostShell>
  )
}
