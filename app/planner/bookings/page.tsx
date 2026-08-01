import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import GuestAppChrome from '@/components/GuestAppChrome'
import TripsList, { type TripBooking } from '@/components/TripsList'
import { resolveBookingCancellationPolicyId } from '@/lib/booking-cancel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mina bokningar' }

type QuoteRow = { status: string; cancellation_policy: string | null }

export default async function PlannerBookingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      `id, status, event_date, event_type, occasions, price_ore, payment_status,
       services!service_id(id, title, photos, cancellation_policy, provider_profiles(stripe_onboarded, users(name))),
       quotes(status, cancellation_policy)`
    )
    .eq('planner_id', user.id)
    .order('created_at', { ascending: false })

  const trips: TripBooking[] = (bookings ?? []).map(b => {
    const raw = b.services as unknown
    const serviceRaw = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      title: string | null
      photos: string[] | null
      cancellation_policy: string | null
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

    const quotes = (b.quotes ?? []) as QuoteRow[]
    const acceptedQuote = quotes.find(q => q.status === 'accepted')

    return {
      id: b.id,
      status: b.status,
      event_date: b.event_date,
      event_type: b.event_type,
      occasions: b.occasions,
      price_ore: b.price_ore,
      payment_status: b.payment_status,
      cancellationPolicyId: resolveBookingCancellationPolicyId({
        acceptedQuotePolicy: acceptedQuote?.cancellation_policy,
        servicePolicy: serviceRaw?.cancellation_policy,
      }),
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
