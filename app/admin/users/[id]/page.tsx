import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, MessageSquare, Phone } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import AdminUserActions from '@/components/admin/AdminUserActions'
import { Badge } from '@/components/ui/badge'
import { hostDisplayName } from '@/lib/host-display-name'

export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', params.id)
    .maybeSingle()
  return { title: `Admin — ${data?.name || data?.email || 'Användare'}` }
}

export default async function AdminUserDetailPage({ params }: Props) {
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select(
      'id, email, name, first_name, last_name, preferred_first_name, phone, avatar_url, user_type, auth_provider, signup_source, created_at, deactivated_at, email_verified_at, terms_accepted_at'
    )
    .eq('id', params.id)
    .maybeSingle()

  if (!user) notFound()

  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('id, bio, city, created_at, stripe_onboarded')
    .eq('user_id', user.id)
    .maybeSingle()

  const [plannerBookings, shortlists, reviewsWritten, messagesSent, eventsCount, services] =
    await Promise.all([
      supabase
        .from('booking_requests')
        .select('id, status, created_at, event_date, services!service_id(title)')
        .eq('planner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('shortlists')
        .select('id, name, created_at, shortlist_items(id)')
        .eq('planner_id', user.id),
      supabase
        .from('reviews')
        .select('id, rating, created_at, services!service_id(title)')
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id),
      supabase
        .from('tracking_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      provider
        ? supabase
            .from('services')
            .select('id, title, is_published, is_disabled, created_at, view_count')
            .eq('provider_profile_id', provider.id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as { id: string; title: string | null; is_published: boolean; is_disabled: boolean; created_at: string; view_count: number | null }[] }),
    ])

  const serviceIds = (services.data ?? []).map(s => s.id)
  const [incomingRes, receivedRes] = await Promise.all([
    serviceIds.length > 0
      ? supabase
          .from('booking_requests')
          .select(
            'id, status, created_at, event_date, users!planner_id(name), services!service_id(title)'
          )
          .in('service_id', serviceIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as never[] }),
    serviceIds.length > 0
      ? supabase
          .from('reviews')
          .select('id, rating, created_at, services!service_id(title)')
          .in('service_id', serviceIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as never[] }),
  ])

  const incomingBookings = incomingRes.data ?? []
  const receivedReviews = receivedRes.data ?? []

  const plannerRows = plannerBookings.data ?? []
  const plannerByStatus = countByStatus(plannerRows.map(b => b.status))
  const incomingByStatus = countByStatus(incomingBookings.map(b => b.status))

  const shortlistCount = shortlists.data?.length ?? 0
  const shortlistItems =
    shortlists.data?.reduce(
      (sum, s) => sum + (Array.isArray(s.shortlist_items) ? s.shortlist_items.length : 0),
      0
    ) ?? 0

  const avgReceived =
    receivedReviews.length > 0
      ? receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length
      : null

  const displayName = hostDisplayName({
    preferred_first_name: user.preferred_first_name,
    first_name: user.first_name,
    last_name: user.last_name,
    name: user.name,
  }) || user.email

  // Threads this user is in (as planner) for chat deep-links
  const threadBookings = plannerRows
    .filter(b => b.status === 'accepted' || b.status === 'completed')
    .slice(0, 8)

  const { data: recentEvents } = await supabase
    .from('tracking_events')
    .select('event_name, created_at, properties')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Alla användare
      </Link>

      <AdminPageHeader
        title={displayName}
        description={user.email}
        actions={
          user.deactivated_at ? (
            <Badge className="rounded-full border-transparent bg-amber-100 font-medium text-amber-900 hover:bg-amber-100">
              Inaktiverad
            </Badge>
          ) : null
        }
      />

      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {user.avatar_url ? (
            <Image src={user.avatar_url} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[24px] font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge status={user.user_type ?? 'planner'} />
            {user.auth_provider ? (
              <Badge variant="outline" className="rounded-full font-normal">
                {user.auth_provider}
              </Badge>
            ) : null}
            {user.signup_source ? (
              <Badge variant="secondary" className="rounded-full font-normal">
                {user.signup_source}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            {user.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" strokeWidth={2} aria-hidden />
                {user.phone}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" strokeWidth={2} aria-hidden />
              Gick med {new Date(user.created_at).toLocaleDateString('sv-SE')}
            </span>
            {user.email_verified_at ? (
              <span>E-post bekräftad</span>
            ) : (
              <span>E-post ej bekräftad</span>
            )}
          </div>
          {provider ? (
            <p className="text-[13px] text-muted-foreground">
              Talangprofil · {provider.city ?? '—'}
              {provider.stripe_onboarded ? ' · Stripe klar' : ''}
            </p>
          ) : null}
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-3 text-[16px] font-semibold text-foreground">Åtgärder</h2>
        <AdminUserActions
          userId={user.id}
          email={user.email}
          name={displayName}
          deactivated={!!user.deactivated_at}
        />
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Förfrågningar (planerare)" value={plannerRows.length} />
        <Stat label="Inkommande (talang)" value={incomingBookings.length} />
        <Stat label="Meddelanden skickade" value={messagesSent.count ?? 0} />
        <Stat label="Tracking-events" value={eventsCount.count ?? 0} />
        <Stat label="Önskelistor" value={shortlistCount} hint={`${shortlistItems} sparade`} />
        <Stat label="Recensioner skrivna" value={reviewsWritten.data?.length ?? 0} />
        <Stat
          label="Recensioner mottagna"
          value={receivedReviews.length}
          hint={avgReceived != null ? `snitt ${avgReceived.toFixed(1)}` : undefined}
        />
        <Stat
          label="Tjänster"
          value={services.data?.length ?? 0}
          hint={
            services.data
              ? `${services.data.filter(s => s.is_published && !s.is_disabled).length} live`
              : undefined
          }
        />
      </div>

      {(Object.keys(plannerByStatus).length > 0 ||
        Object.keys(incomingByStatus).length > 0) && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {Object.keys(plannerByStatus).length > 0 ? (
            <StatusCard title="Planerarens bokningar" counts={plannerByStatus} />
          ) : null}
          {Object.keys(incomingByStatus).length > 0 ? (
            <StatusCard title="Inkommande till talang" counts={incomingByStatus} />
          ) : null}
        </div>
      )}

      {services.data && services.data.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[16px] font-semibold text-foreground">Tjänster</h2>
          <div className="space-y-2">
            {services.data.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {s.title ?? 'Utan titel'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {s.view_count ?? 0} visningar ·{' '}
                    {new Date(s.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="rounded-full font-normal">
                    {s.is_published && !s.is_disabled
                      ? 'Publicerad'
                      : s.is_disabled
                        ? 'Pausad'
                        : 'Utkast'}
                  </Badge>
                  <Link
                    href={`/tjanster/${s.id}`}
                    className="text-[13px] font-medium text-primary hover:underline"
                    target="_blank"
                  >
                    Visa
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {threadBookings.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[16px] font-semibold text-foreground">
            Konversationer
          </h2>
          <div className="space-y-2">
            {threadBookings.map(b => {
              const svc = Array.isArray(b.services) ? b.services[0] : b.services
              return (
                <Link
                  key={b.id}
                  href={`/admin/messages/${b.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-foreground">
                      {(svc as { title?: string | null } | null)?.title ?? 'Bokning'}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {b.event_date
                        ? new Date(b.event_date).toLocaleDateString('sv-SE')
                        : new Date(b.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
                    <MessageSquare className="size-3.5" strokeWidth={2} aria-hidden />
                    Öppna
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {plannerRows.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[16px] font-semibold text-foreground">
            Senaste förfrågningar
          </h2>
          <div className="space-y-2">
            {plannerRows.slice(0, 8).map(b => {
              const svc = Array.isArray(b.services) ? b.services[0] : b.services
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-foreground">
                      {(svc as { title?: string | null } | null)?.title ?? 'Tjänst'}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <AdminStatusBadge status={b.status} />
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {recentEvents && recentEvents.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[16px] font-semibold text-foreground">
            Senaste events
          </h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-background">
            {recentEvents.map((ev, i) => (
              <div
                key={`${ev.event_name}-${ev.created_at}-${i}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-foreground">
                    {ev.event_name}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {new Date(ev.created_at).toLocaleString('sv-SE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {provider?.bio ? (
        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-2 text-[16px] font-semibold text-foreground">Bio</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
            {provider.bio}
          </p>
        </section>
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[24px] font-semibold tracking-tight text-foreground">
        {value.toLocaleString('sv-SE')}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function StatusCard({
  title,
  counts,
}: {
  title: string
  counts: Record<string, number>
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="mb-3 text-[14px] font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between gap-2">
            <AdminStatusBadge status={status} />
            <span className="text-[15px] font-semibold text-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function countByStatus(statuses: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of statuses) {
    out[s] = (out[s] ?? 0) + 1
  }
  return out
}
