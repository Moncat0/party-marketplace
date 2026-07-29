import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import RequestsList from './RequestsList'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServicesForUser } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Förfrågningar' }

export default async function RequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard/requests')

  const result = await getServicesForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceIds = result.services.map(s => s.id)

  const { data: requests } = serviceIds.length
    ? await supabase
        .from('booking_requests')
        .select('*, users!planner_id(id, name, email)')
        .in('service_id', serviceIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <ProviderHostShell>
      <RequestsList requests={requests ?? []} />
    </ProviderHostShell>
  )
}
