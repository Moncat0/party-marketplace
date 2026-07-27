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
      'id, status, event_date, event_type, price_ore, payment_status, services!service_id(id, title, photos, provider_profiles(stripe_onboarded, users(name)))'
    )
    .eq('planner_id', user.id)
    .order('created_at', { ascending: false })

  const trips: TripBooking[] = (bookings ?? []).map(b => {
    const raw = b.services as unknown
    const serviceRaw = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      title: string | null
      photos: string[] | null
      provider_profiles:
        | { stripe_onboarded: boolean; users: { name: string | null } | { name: string | null }[] | null }
        | { stripe_onboarded: boolean; users: { name: string | null } | { name: string | null }[] | null }[]
        | null
    } | null

    const provider = serviceRaw?.provider_profiles
      ? Array.isArray(serviceRaw.provider_profiles)
        ? serviceRaw.provider_profiles[0]
        : serviceRaw.provider_profiles
      : null

    const users = provider?.users
      ? Array.isArray(provider.users)
        ? provider.users[0] ?? null
        : provider.users
      : null

    return {
      id: b.id,
      status: b.status,
      event_date: b.event_date,
      event_type: b.event_type,
      price_ore: b.price_ore,
      payment_status: b.payment_status,
      services: serviceRaw
        ? {
            id: serviceRaw.id,
            title: serviceRaw.title,
            photos: serviceRaw.photos,
            stripe_onboarded: provider?.stripe_onboarded ?? false,
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
