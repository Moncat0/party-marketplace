import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import GuestAppChrome from '@/components/GuestAppChrome'
import TripsList, { type TripBooking } from '@/components/TripsList'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mina bokningar' }

export default async function PlannerBookingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      'id, status, event_date, event_type, price_ore, payment_status, provider_profiles!provider_profile_id(id, service_title, stripe_onboarded, photos, users(name))'
    )
    .eq('planner_id', user.id)
    .order('created_at', { ascending: false })

  const trips: TripBooking[] = (bookings ?? []).map(b => {
    const raw = b.provider_profiles as unknown
    const profileRaw = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      service_title: string | null
      stripe_onboarded: boolean
      photos: string[] | null
      users: { name: string | null } | { name: string | null }[] | null
    } | null

    const users = profileRaw?.users
      ? Array.isArray(profileRaw.users)
        ? profileRaw.users[0] ?? null
        : profileRaw.users
      : null

    return {
      id: b.id,
      status: b.status,
      event_date: b.event_date,
      event_type: b.event_type,
      price_ore: b.price_ore,
      payment_status: b.payment_status,
      provider_profiles: profileRaw
        ? {
            id: profileRaw.id,
            service_title: profileRaw.service_title,
            stripe_onboarded: profileRaw.stripe_onboarded,
            photos: profileRaw.photos,
            users,
          }
        : null,
    }
  })

  return (
    <GuestAppChrome>
      <TripsList bookings={trips} />
    </GuestAppChrome>
  )
}
