import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/AccountLayout'
import AccountSettings from './AccountSettings'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

export const metadata = { title: 'Inställningar' }
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const { data: userData } = await supabase
    .from('users')
    .select('name, first_name, last_name, phone, auth_provider, notif_marketing')
    .eq('id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return await redirectWithoutProviderProfile(supabase, user.id)

  return (
    <AccountLayout doneHref="/dashboard">
      <AccountSettings
        email={user.email ?? ''}
        firstName={userData?.first_name ?? ''}
        lastName={userData?.last_name ?? ''}
        phone={userData?.phone ?? ''}
        authProvider={userData?.auth_provider ?? null}
        notifMarketing={userData?.notif_marketing ?? true}
      />
    </AccountLayout>
  )
}
