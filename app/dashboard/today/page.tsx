import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import TodayBookingsClient, {
  type HostBooking,
} from '@/components/dashboard/TodayBookingsClient'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServiceForUser } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Idag' }

export default async function TodayPage({
  searchParams,
}: {
  searchParams: { view?: string }
}) {
  const view = searchParams.view === 'upcoming' ? 'upcoming' : 'today'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const result = await getServiceForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const { service } = result
  const serviceId = service?.id ?? null

  const todayIso = new Date().toISOString().slice(0, 10)

  const { data: accepted } = serviceId
    ? await supabase
        .from('booking_requests')
        .select(
          'id, event_date, event_type, event_location, guest_count, users!planner_id(name)'
        )
        .eq('service_id', serviceId)
        .eq('status', 'accepted')
        .order('event_date', { ascending: true })
    : { data: [] }

  function toBooking(row: {
    id: string
    event_date: string | null
    event_type: string | null
    event_location: string | null
    guest_count: number | null
    users: { name: string | null } | { name: string | null }[] | null
  }): HostBooking {
    const planner = Array.isArray(row.users) ? row.users[0] : row.users
    return {
      id: row.id,
      event_date: row.event_date,
      event_type: row.event_type,
      event_location: row.event_location,
      guest_count: row.guest_count,
      planner_name: planner?.name ?? null,
    }
  }

  const all = (accepted ?? []).map(toBooking)
  const today = all.filter(b => b.event_date === todayIso)
  const upcoming = all.filter(b => b.event_date != null && b.event_date > todayIso)

  return (
    <ProviderHostShell>
      <TodayBookingsClient
        view={view}
        today={today}
        upcoming={upcoming}
        hasPublishedListing={!!service?.is_published}
      />
    </ProviderHostShell>
  )
}
