import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import HostProfileForm from './HostProfileForm'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Min profil' }

type Props = {
  searchParams: { service?: string }
}

export default async function ProviderProfilePage({ searchParams }: Props) {
  // Legacy listing-editor bookmarks: /dashboard/profile?service=<id>
  if (searchParams.service) {
    redirect(`/dashboard/listings/${searchParams.service}/edit`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard/profile')

  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id, bio, location_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!provider) return await redirectWithoutProviderProfile(supabase, user.id)

  const { data: userData } = await supabase
    .from('users')
    .select('first_name, last_name, preferred_first_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <ProviderHostShell>
      <HostProfileForm
        userId={user.id}
        firstName={userData?.first_name ?? ''}
        lastName={userData?.last_name ?? ''}
        preferredFirstName={userData?.preferred_first_name ?? ''}
        avatarUrl={userData?.avatar_url ?? null}
        bio={provider.bio ?? ''}
        basedInLocationId={provider.location_id ?? null}
      />
    </ProviderHostShell>
  )
}
