import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin — Konversationer' }
export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  const supabase = createAdminClient()

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      'id, status, event_date, users!planner_id(name, email), services!service_id(title, provider_profiles(users(name, email)))'
    )
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })

  const { data: msgCounts } = await supabase.from('messages').select('booking_request_id')

  const countMap: Record<string, number> = {}
  msgCounts?.forEach(m => {
    countMap[m.booking_request_id] = (countMap[m.booking_request_id] ?? 0) + 1
  })

  const bookingsWithMessages = (bookings ?? []).filter(b => (countMap[b.id] ?? 0) > 0)

  return (
    <div>
      <AdminPageHeader
        title="Konversationer"
        description={`${bookingsWithMessages.length} trådar med meddelanden`}
      />

      {bookingsWithMessages.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga konversationer än.</p>
      ) : (
        <div className="space-y-2">
          {bookingsWithMessages.map(booking => {
            const planner = (
              Array.isArray(booking.users) ? booking.users[0] : booking.users
            ) as { name: string | null; email: string } | null
            const serviceRaw = booking.services as unknown
            const service = (
              Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw
            ) as {
              title: string | null
              provider_profiles:
                | {
                    users:
                      | { name: string | null; email: string }
                      | { name: string | null; email: string }[]
                      | null
                  }
                | {
                    users:
                      | { name: string | null; email: string }
                      | { name: string | null; email: string }[]
                      | null
                  }[]
                | null
            } | null
            const profile = service?.provider_profiles
              ? Array.isArray(service.provider_profiles)
                ? service.provider_profiles[0]
                : service.provider_profiles
              : null
            const providerUser = profile?.users
              ? Array.isArray(profile.users)
                ? profile.users[0]
                : profile.users
              : null
            const msgCount = countMap[booking.id] ?? 0

            return (
              <Link
                key={booking.id}
                href={`/admin/messages/${booking.id}`}
                className="block rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge status={booking.status} />
                      {booking.event_date ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Calendar className="size-3" strokeWidth={2} aria-hidden />
                          {new Date(booking.event_date).toLocaleDateString('sv-SE', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {planner?.name ?? planner?.email ?? 'Okänd planerare'}
                      <span className="font-normal text-muted-foreground"> → </span>
                      {providerUser?.name ?? service?.title ?? 'Okänd talang'}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {planner?.email} · {providerUser?.email}
                    </p>
                  </div>
                  <Badge className="shrink-0 rounded-full bg-primary/10 font-semibold text-primary hover:bg-primary/10">
                    {msgCount} {msgCount === 1 ? 'meddelande' : 'meddelanden'}
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
