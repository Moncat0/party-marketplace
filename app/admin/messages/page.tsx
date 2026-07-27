import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Admin — Konversationer' }

export default async function AdminMessagesPage() {
  const supabase = createAdminClient()

  // Get all bookings that have at least one message
  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('id, status, event_date, users!planner_id(name, email), services!service_id(title, provider_profiles(users(name, email)))')
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })

  // Get message counts per booking
  const { data: msgCounts } = await supabase
    .from('messages')
    .select('booking_request_id')

  const countMap: Record<string, number> = {}
  msgCounts?.forEach(m => {
    countMap[m.booking_request_id] = (countMap[m.booking_request_id] ?? 0) + 1
  })

  const bookingsWithMessages = (bookings ?? []).filter(b => (countMap[b.id] ?? 0) > 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#222222]">Konversationer</h1>
        <p className="text-sm text-[#6A6A6A] mt-1">{bookingsWithMessages.length} aktiva konversationer</p>
      </div>

      {bookingsWithMessages.length === 0 ? (
        <p className="text-sm text-[#6A6A6A]">Inga konversationer än.</p>
      ) : (
        <div className="space-y-4">
          {bookingsWithMessages.map(booking => {
            const planner = (Array.isArray(booking.users) ? booking.users[0] : booking.users) as { name: string | null; email: string } | null
            const serviceRaw = booking.services as unknown
            const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
              title: string | null
              provider_profiles: { users: { name: string | null; email: string } | null } | { users: { name: string | null; email: string } | null }[] | null
            } | null
            const profile = service?.provider_profiles
              ? Array.isArray(service.provider_profiles)
                ? service.provider_profiles[0]
                : service.provider_profiles
              : null
            const msgCount = countMap[booking.id] ?? 0

            return (
              <Link
                key={booking.id}
                href={`/admin/messages/${booking.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm hover:bg-[#F2F2F2] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-[#222222]/10 text-[#222222]' : 'bg-[#1D9E75]/10 text-[#1D9E75]'
                      }`}>
                        {booking.status === 'completed' ? 'Avslutad' : 'Aktiv'}
                      </span>
                      {booking.event_date && (
                        <span className="text-xs text-[#6A6A6A]">
                          📅 {new Date(booking.event_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#222222]">
                      {planner?.name ?? planner?.email ?? 'Okänd planerare'}
                      <span className="font-normal text-[#6A6A6A]"> → </span>
                      {profile?.users?.name ?? service?.title ?? 'Okänd talang'}
                    </p>
                    <p className="text-xs text-[#6A6A6A] mt-0.5">
                      {planner?.email} · {profile?.users?.email}
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] px-2.5 py-1 text-xs font-semibold">
                    {msgCount} {msgCount === 1 ? 'meddelande' : 'meddelanden'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
