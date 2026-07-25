import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'

export const metadata = { title: 'Min statistik' }

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id, service_title, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) return await redirectWithoutProviderProfile(supabase, user.id)

  // Booking stats
  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, status, created_at')
    .eq('provider_profile_id', profile.id)

  const total = bookings?.length ?? 0
  const pending = bookings?.filter(b => b.status === 'pending').length ?? 0
  const accepted = bookings?.filter(b => b.status === 'accepted').length ?? 0
  const declined = bookings?.filter(b => b.status === 'declined').length ?? 0

  // Review stats
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('provider_profile_id', profile.id)

  const reviewCount = reviews?.length ?? 0
  const avgRating = reviewCount > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null

  // Message count
  const bookingIds = (bookings ?? []).map(b => b.id)
  const { count: messageCount } = bookingIds.length > 0
    ? await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('booking_request_id', bookingIds)
    : { count: 0 }

  // Days on platform
  const daysOnPlatform = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Acceptance rate
  const responded = accepted + declined
  const acceptanceRate = responded > 0 ? Math.round((accepted / responded) * 100) : null

  const statCards = [
    { label: 'Förfrågningar totalt', value: total, emoji: '📋', sub: null },
    { label: 'Väntande svar', value: pending, emoji: '⏳', sub: null },
    { label: 'Accepterade', value: accepted, emoji: '✅', sub: acceptanceRate !== null ? `${acceptanceRate}% svarsgrad` : null },
    { label: 'Avvisade', value: declined, emoji: '❌', sub: null },
    { label: 'Recensioner', value: reviewCount, emoji: '⭐', sub: avgRating !== null ? `Snitt ${avgRating.toFixed(1)} / 5` : null },
    { label: 'Meddelanden', value: messageCount ?? 0, emoji: '💬', sub: null },
    { label: 'Dagar på FESTEN.', value: daysOnPlatform, emoji: '🎉', sub: null },
  ]

  return (
    <main className="min-h-screen bg-[#FFFFFF] px-4 py-10">
      <div className="mx-auto max-w-sm">

        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-[#6A6A6A] hover:text-[#222222]">← Tillbaka</Link>
          <h1 className="mt-1 text-2xl font-bold text-[#222222]">Min statistik</h1>
          <p className="text-sm text-[#6A6A6A]">{profile.service_title}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map(card => (
            <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xl mb-1">{card.emoji}</p>
              <p className="text-2xl font-bold text-[#222222]">{card.value}</p>
              <p className="text-xs text-[#6A6A6A] mt-0.5">{card.label}</p>
              {card.sub && (
                <p className="text-xs text-[#1D9E75] font-medium mt-1">{card.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Tip */}
        {total === 0 && (
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#DDDDDD] p-4 text-center">
            <p className="text-sm text-[#6A6A6A]">
              Inga förfrågningar ännu. Se till att din profil är publicerad och komplett — det ökar chansen att bli hittad! 🚀
            </p>
            <Link
              href="/dashboard/profile"
              className="mt-3 inline-block text-sm font-medium text-[#FF6B35] hover:underline"
            >
              Uppdatera din profil →
            </Link>
          </div>
        )}

        {/* Link to reviews */}
        {reviewCount > 0 && (
          <Link
            href="/dashboard/reviews"
            className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm hover:bg-[#F2F2F2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-medium text-[#222222]">Visa alla recensioner</span>
            </div>
            <span className="text-[#FF6B35]">→</span>
          </Link>
        )}

      </div>
    </main>
  )
}
