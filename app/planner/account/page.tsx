import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/AccountLayout'
import PlannerAccountSettings from './PlannerAccountSettings'

export const metadata = { title: 'Inställningar' }
export const dynamic = 'force-dynamic'

export default async function PlannerAccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: userData } = await supabase
    .from('users')
    .select('name, first_name, last_name, phone, auth_provider, notif_marketing')
    .eq('id', user.id)
    .single()

  return (
    <AccountLayout doneHref="/planner/dashboard">
      <PlannerAccountSettings
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
