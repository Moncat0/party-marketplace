import { createAdminClient } from '@/lib/supabase-admin'

export const metadata = { title: 'Admin — Bokningar' }

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Väntande',
  accepted: 'Accepterad',
  declined: 'Avvisad',
}

export default async function AdminBookingsPage() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, status, event_type, event_date, event_location, guest_count, created_at, users!planner_id(name, email), provider_profiles!provider_profile_id(service_title)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#222222]">Bokningar</h1>
        <span className="text-sm text-[#6A6A6A]">{bookings?.length ?? 0} totalt</span>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-[#6A6A6A]">Inga bokningar ännu.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b: any) => (
            <div key={b.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#222222] truncate">
                    {b.users?.name ?? 'Okänd'} → {b.provider_profiles?.service_title ?? 'Okänd'}
                  </p>
                  <p className="text-xs text-[#6A6A6A] truncate">{b.users?.email ?? '—'}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[b.status] ?? b.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {b.event_type && <span className="text-xs text-[#6A6A6A]">🎉 {b.event_type}</span>}
                {b.event_date && <span className="text-xs text-[#6A6A6A]">📅 {b.event_date}</span>}
                {b.event_location && <span className="text-xs text-[#6A6A6A]">📍 {b.event_location}</span>}
                {b.guest_count && <span className="text-xs text-[#6A6A6A]">👥 {b.guest_count} gäster</span>}
                <span className="text-xs text-[#6A6A6A]">Skickad {new Date(b.created_at).toLocaleDateString('sv-SE')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
