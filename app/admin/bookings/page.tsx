import { Calendar, MapPin, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'

export const metadata = { title: 'Admin — Bokningar' }
export const dynamic = 'force-dynamic'

export default async function AdminBookingsPage() {
  const supabase = createAdminClient()
  const agingCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      'id, status, event_type, event_date, event_location, guest_count, created_at, users!planner_id(name, email), services!service_id(title)'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  const agingCount =
    bookings?.filter(b => b.status === 'pending' && b.created_at < agingCutoff).length ?? 0

  return (
    <div>
      <AdminPageHeader
        title="Bokningar"
        description={
          agingCount > 0
            ? `${bookings?.length ?? 0} senaste · ${agingCount} väntande >48h`
            : `${bookings?.length ?? 0} senaste (max 200)`
        }
      />

      {!bookings || bookings.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga bokningar ännu.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => {
            const users = Array.isArray(b.users) ? b.users[0] : b.users
            const services = Array.isArray(b.services) ? b.services[0] : b.services
            const aging = b.status === 'pending' && b.created_at < agingCutoff
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {(users as { name?: string | null } | null)?.name ?? 'Okänd'} →{' '}
                      {(services as { title?: string | null } | null)?.title ?? 'Okänd'}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {(users as { email?: string | null } | null)?.email ?? '—'}
                      {aging ? ' · Väntar >48h' : ''}
                    </p>
                  </div>
                  <AdminStatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                  {b.event_type ? <span>{b.event_type}</span> : null}
                  {b.event_date ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" strokeWidth={2} aria-hidden />
                      {b.event_date}
                    </span>
                  ) : null}
                  {b.event_location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" strokeWidth={2} aria-hidden />
                      {b.event_location}
                    </span>
                  ) : null}
                  {b.guest_count ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" strokeWidth={2} aria-hidden />
                      {b.guest_count} gäster
                    </span>
                  ) : null}
                  <span>Skickad {new Date(b.created_at).toLocaleDateString('sv-SE')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
