import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const metadata = { title: 'Admin — Översikt' }

async function getStats() {
  const supabase = createAdminClient()
  const [users, providers, bookings, reviews, messages] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('provider_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('booking_requests').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
  ])
  return {
    users: users.count ?? 0,
    providers: providers.count ?? 0,
    bookings: bookings.count ?? 0,
    reviews: reviews.count ?? 0,
    messages: messages.count ?? 0,
  }
}

async function getRecentBookings() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('booking_requests')
    .select('id, status, created_at, event_type, users!planner_id(name), provider_profiles!provider_profile_id(service_title)')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
}

export default async function AdminOverviewPage() {
  const [stats, recentBookings] = await Promise.all([getStats(), getRecentBookings()])

  const statCards = [
    { label: 'Användare', value: stats.users, href: '/admin/users', emoji: '👤' },
    { label: 'Talanger', value: stats.providers, href: '/admin/providers', emoji: '🎭' },
    { label: 'Bokningar', value: stats.bookings, href: '/admin/bookings', emoji: '📅' },
    { label: 'Recensioner', value: stats.reviews, href: '/admin/reviews', emoji: '⭐' },
    { label: 'Meddelanden', value: stats.messages, href: '#', emoji: '💬' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A2E] mb-6">Översikt</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {statCards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl bg-white p-4 shadow-sm hover:bg-[#F0EDE8] transition-colors"
          >
            <p className="text-2xl mb-1">{card.emoji}</p>
            <p className="text-2xl font-bold text-[#1A1A2E]">{card.value}</p>
            <p className="text-xs text-[#5F5E5A]">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <h2 className="text-sm font-semibold text-[#1A1A2E] mb-3">Senaste bokningar</h2>
      {recentBookings.length === 0 ? (
        <p className="text-sm text-[#5F5E5A]">Inga bokningar ännu.</p>
      ) : (
        <div className="space-y-2">
          {recentBookings.map((b: any) => (
            <div key={b.id} className="rounded-xl bg-white p-3 shadow-sm flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1A1A2E] truncate">
                  {(b.users as any)?.name ?? 'Okänd'} → {(b.provider_profiles as any)?.service_title ?? 'Okänd'}
                </p>
                <p className="text-xs text-[#5F5E5A]">
                  {b.event_type ?? '—'} · {new Date(b.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
