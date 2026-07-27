import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import EditProfileForm from './EditProfileForm'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import {
  ensureProviderAndService,
  getServiceByIdForProvider,
  getServicesForProvider,
} from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Redigera tjänst' }

type Props = {
  searchParams: { service?: string }
}

export default async function EditProfilePage({ searchParams }: Props) {
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

  let service = searchParams.service
    ? await getServiceByIdForProvider(supabase, existingProvider.id, searchParams.service)
    : null

  if (!service) {
    const services = await getServicesForProvider(supabase, existingProvider.id)
    service = services[0] ?? null
  }

  if (!service) {
    const result = await ensureProviderAndService(supabase, user.id)
    if (result.error) return await redirectWithoutProviderProfile(supabase, user.id)
    const services = await getServicesForProvider(supabase, result.providerId)
    service = services[0] ?? null
  }

  if (!service) return await redirectWithoutProviderProfile(supabase, user.id)

  return (
    <ProviderHostShell>
      <EditProfileForm service={service} userId={user.id} />
    </ProviderHostShell>
  )
}
