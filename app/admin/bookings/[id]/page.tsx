import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageSquare, History } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import AdminBookingActions from '@/components/admin/AdminBookingActions'

export const dynamic = 'force-dynamic'

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'Födelsedag', kids: 'Barnkalas', wedding: 'Bröllop',
  corporate: 'Företagsevent', graduation: 'Student', crayfish: 'Kräftskiva',
  midsommar: 'Midsommar', christmas: 'Julbord', hen_stag: 'Möhippa/Svensexa',
  anniversary: 'Jubileum', housewarming: 'Inflyttning', other: 'Övrigt',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Väntande',
  accepted: 'Accepterad',
  declined: 'Nekad',
  completed: 'Genomförd',
  cancelled: 'Avbokad',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  provider: 'Leverantör',
  planner: 'Planerare',
}

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: booking } = await supabase
    .from('booking_requests')
    .select(`
      id, status, event_type, event_date, event_location, guest_count,
      occasions, description, created_at,
      payment_status, price_ore,
      users!planner_id(id, name, email),
      services!service_id(id, title, provider_profiles!provider_profile_id(users!user_id(name, email)))
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!booking) notFound()

  const [{ data: messages }, { data: history }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, content, created_at, sender_id, users!sender_id(name)')
      .eq('booking_request_id', params.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('booking_status_history')
      .select('id, from_status, to_status, changed_by_role, note, created_at, users!changed_by_id(name)')
      .eq('booking_id', params.id)
      .order('created_at', { ascending: true }),
  ])

  const planner = Array.isArray(booking.users) ? booking.users[0] : booking.users
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services
  const providerUsers = (service as any)?.provider_profiles?.users
  const provider = Array.isArray(providerUsers) ? providerUsers[0] : providerUsers

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Bokningar
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">
            {(planner as any)?.name ?? 'Okänd'} → {(service as any)?.title ?? 'Okänd tjänst'}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Boknings-ID: <code className="font-mono text-[12px]">{booking.id}</code>
          </p>
        </div>
        <AdminStatusBadge status={booking.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Details */}
        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Detaljer</h2>
          <dl className="space-y-3 text-[13px]">
            <Row label="Planerare">
              {(planner as any)?.name} · {(planner as any)?.email}
            </Row>
            <Row label="Leverantör">
              {(provider as any)?.name ?? '—'} · {(service as any)?.title}
            </Row>
            {booking.event_date ? <Row label="Datum">{booking.event_date}</Row> : null}
            {booking.event_type ? (
              <Row label="Typ">{EVENT_TYPE_LABELS[booking.event_type] ?? booking.event_type}</Row>
            ) : null}
            {booking.event_location ? <Row label="Plats">{booking.event_location}</Row> : null}
            {booking.guest_count ? <Row label="Gäster">{booking.guest_count}</Row> : null}
            {booking.description ? <Row label="Meddelande">{booking.description}</Row> : null}
            <Row label="Skickad">{new Date(booking.created_at).toLocaleString('sv-SE')}</Row>
            {booking.payment_status ? <Row label="Betalning">{booking.payment_status}</Row> : null}
            {booking.price_ore ? (
              <Row label="Pris">{(booking.price_ore / 100).toLocaleString('sv-SE')} kr</Row>
            ) : null}
          </dl>
        </section>

        {/* Admin actions */}
        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Åtgärder</h2>
          <AdminBookingActions bookingId={booking.id} currentStatus={booking.status} />
        </section>
      </div>

      {/* Status history */}
      <section className="mt-4 rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-4 inline-flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <History className="size-4" strokeWidth={2} />
          Statushistorik ({history?.length ?? 0})
        </h2>
        {!history || history.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">
            Ingen historik ännu — registreras automatiskt vid nästa statusändring.
          </p>
        ) : (
          <ol className="relative border-l border-border pl-5 space-y-4">
            {history.map(h => {
              const actor = Array.isArray(h.users) ? h.users[0] : h.users
              const actorName = (actor as any)?.name ?? ROLE_LABELS[h.changed_by_role ?? ''] ?? 'Okänd'
              return (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-background bg-border" />
                  <p className="text-[13px] font-medium text-foreground">
                    {h.from_status ? (
                      <>
                        <span className="text-muted-foreground">{STATUS_LABELS[h.from_status] ?? h.from_status}</span>
                        {' → '}
                      </>
                    ) : null}
                    {STATUS_LABELS[h.to_status] ?? h.to_status}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {actorName}
                    {h.changed_by_role ? ` (${ROLE_LABELS[h.changed_by_role]})` : ''}
                    {' · '}
                    {new Date(h.created_at).toLocaleString('sv-SE')}
                  </p>
                  {h.note ? (
                    <p className="mt-0.5 text-[12px] text-muted-foreground italic">{h.note}</p>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* Messages */}
      <section className="mt-4 rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-4 inline-flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <MessageSquare className="size-4" strokeWidth={2} />
          Meddelanden ({messages?.length ?? 0})
        </h2>
        {!messages || messages.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">Inga meddelanden ännu.</p>
        ) : (
          <div className="space-y-3">
            {messages.map(m => {
              const sender = Array.isArray(m.users) ? m.users[0] : m.users
              return (
                <div key={m.id} className="border-l-2 border-border pl-4">
                  <p className="text-[12px] font-semibold text-foreground">
                    {(sender as any)?.name ?? 'Okänd'}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {new Date(m.created_at).toLocaleString('sv-SE')}
                    </span>
                  </p>
                  <p className="mt-1 text-[13px] text-foreground">{m.content ?? '—'}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  )
}
