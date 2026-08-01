import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminRange,
  pctDelta,
  rangeWindows,
  rate,
} from '@/lib/admin-range'

async function countRows(
  supabase: SupabaseClient,
  table: string,
  opts: {
    since?: Date | null
    until?: Date | null
    column?: string
    eq?: Record<string, string | boolean>
    in?: { column: string; values: string[] }
  } = {}
): Promise<number> {
  const column = opts.column ?? 'created_at'
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  if (opts.since) q = q.gte(column, opts.since.toISOString())
  if (opts.until) q = q.lt(column, opts.until.toISOString())
  if (opts.eq) {
    for (const [k, v] of Object.entries(opts.eq)) {
      q = q.eq(k, v)
    }
  }
  if (opts.in) q = q.in(opts.in.column, opts.in.values)
  const { count } = await q
  return count ?? 0
}

async function countEvents(
  supabase: SupabaseClient,
  eventName: string,
  since: Date | null,
  until?: Date | null
): Promise<number> {
  return countRows(supabase, 'tracking_events', {
    since,
    until: until ?? null,
    eq: { event_name: eventName },
  })
}

export type Kpi = {
  key: string
  label: string
  value: number
  previous: number | null
  deltaPct: number | null
  format?: 'number' | 'percent'
  href?: string
  hint?: string
}

export type OverviewMetrics = {
  range: AdminRange
  kpis: Kpi[]
  secondary: Kpi[]
  requestsByDay: { date: string; count: number }[]
  activity: {
    id: string
    kind: string
    label: string
    at: string
  }[]
  pendingAging: number
}

export async function getOverviewMetrics(
  supabase: SupabaseClient,
  range: AdminRange
): Promise<OverviewMetrics> {
  const { start, prevStart, prevEnd } = rangeWindows(range)

  const [
    publishedServices,
    requests,
    prevRequests,
    accepted,
    declined,
    prevAccepted,
    prevDeclined,
    newProviders,
    prevProviders,
    newUsers,
    prevUsers,
    shortlistSaves,
    prevShortlist,
    messages,
    prevMessages,
    reviews,
    prevReviews,
    pendingAging,
  ] = await Promise.all([
    countRows(supabase, 'services', {
      eq: { is_published: true, is_disabled: false },
    }),
    countRows(supabase, 'booking_requests', { since: start }),
    countRows(supabase, 'booking_requests', {
      since: prevStart,
      until: prevEnd,
    }),
    countRows(supabase, 'booking_requests', {
      since: start,
      eq: { status: 'accepted' },
    }),
    countRows(supabase, 'booking_requests', {
      since: start,
      eq: { status: 'declined' },
    }),
    countRows(supabase, 'booking_requests', {
      since: prevStart,
      until: prevEnd,
      eq: { status: 'accepted' },
    }),
    countRows(supabase, 'booking_requests', {
      since: prevStart,
      until: prevEnd,
      eq: { status: 'declined' },
    }),
    countRows(supabase, 'provider_profiles', { since: start }),
    countRows(supabase, 'provider_profiles', {
      since: prevStart,
      until: prevEnd,
    }),
    countRows(supabase, 'users', { since: start }),
    countRows(supabase, 'users', { since: prevStart, until: prevEnd }),
    countRows(supabase, 'shortlist_items', {
      since: start,
      column: 'added_at',
    }),
    countRows(supabase, 'shortlist_items', {
      since: prevStart,
      until: prevEnd,
      column: 'added_at',
    }),
    countRows(supabase, 'messages', { since: start }),
    countRows(supabase, 'messages', { since: prevStart, until: prevEnd }),
    countRows(supabase, 'reviews', { since: start }),
    countRows(supabase, 'reviews', { since: prevStart, until: prevEnd }),
    countRows(supabase, 'booking_requests', {
      until: new Date(Date.now() - 48 * 60 * 60 * 1000),
      eq: { status: 'pending' },
    }),
  ])

  const acceptance = rate(accepted, accepted + declined)
  const prevAcceptance = rate(prevAccepted, prevAccepted + prevDeclined)

  const kpis: Kpi[] = [
    {
      key: 'published',
      label: 'Publicerade tjänster',
      value: publishedServices,
      previous: null,
      deltaPct: null,
      href: '/admin/marketplace',
      hint: 'Aktiva just nu',
    },
    {
      key: 'requests',
      label: 'Nya förfrågningar',
      value: requests,
      previous: range === 'all' ? null : prevRequests,
      deltaPct: range === 'all' ? null : pctDelta(requests, prevRequests),
      href: '/admin/bookings',
    },
    {
      key: 'acceptance',
      label: 'Acceptansgrad',
      value: acceptance ?? 0,
      previous: range === 'all' ? null : prevAcceptance,
      deltaPct:
        range === 'all' || acceptance == null || prevAcceptance == null
          ? null
          : acceptance - prevAcceptance,
      format: 'percent',
      href: '/admin/bookings',
      hint: 'Accepterade ÷ besvarade',
    },
    {
      key: 'providers',
      label: 'Nya talanger',
      value: newProviders,
      previous: range === 'all' ? null : prevProviders,
      deltaPct: range === 'all' ? null : pctDelta(newProviders, prevProviders),
      href: '/admin/providers',
    },
    {
      key: 'users',
      label: 'Nya användare',
      value: newUsers,
      previous: range === 'all' ? null : prevUsers,
      deltaPct: range === 'all' ? null : pctDelta(newUsers, prevUsers),
      href: '/admin/users',
    },
  ]

  const secondary: Kpi[] = [
    {
      key: 'shortlists',
      label: 'Sparade i önskelista',
      value: shortlistSaves,
      previous: range === 'all' ? null : prevShortlist,
      deltaPct: range === 'all' ? null : pctDelta(shortlistSaves, prevShortlist),
    },
    {
      key: 'messages',
      label: 'Meddelanden',
      value: messages,
      previous: range === 'all' ? null : prevMessages,
      deltaPct: range === 'all' ? null : pctDelta(messages, prevMessages),
      href: '/admin/messages',
    },
    {
      key: 'reviews',
      label: 'Recensioner',
      value: reviews,
      previous: range === 'all' ? null : prevReviews,
      deltaPct: range === 'all' ? null : pctDelta(reviews, prevReviews),
      href: '/admin/reviews',
    },
    {
      key: 'aging',
      label: 'Väntande >48h',
      value: pendingAging,
      previous: null,
      deltaPct: null,
      href: '/admin/bookings',
      hint: 'Kräver uppföljning',
    },
  ]

  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const { data: recentRequestRows } = await supabase
    .from('booking_requests')
    .select('id, created_at')
    .gte('created_at', since14.toISOString())
    .order('created_at', { ascending: true })

  const byDay = new Map<string, number>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    byDay.set(d.toISOString().slice(0, 10), 0)
  }
  for (const row of recentRequestRows ?? []) {
    const key = row.created_at.slice(0, 10)
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }
  const requestsByDay = Array.from(byDay.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  const { data: recentBookings } = await supabase
    .from('booking_requests')
    .select('id, status, created_at, users!planner_id(name), services!service_id(title)')
    .order('created_at', { ascending: false })
    .limit(8)

  const activity = (recentBookings ?? []).map(b => {
    const users = Array.isArray(b.users) ? b.users[0] : b.users
    const services = Array.isArray(b.services) ? b.services[0] : b.services
    const planner = (users as { name?: string | null } | null)?.name ?? 'Planerare'
    const title = (services as { title?: string | null } | null)?.title ?? 'tjänst'
    return {
      id: b.id,
      kind: b.status,
      label: `${planner} → ${title}`,
      at: b.created_at,
    }
  })

  return {
    range,
    kpis,
    secondary,
    requestsByDay,
    activity,
    pendingAging,
  }
}

const GROWTH_EVENTS = [
  { key: 'search_performed', label: 'Sökningar' },
  { key: 'profile_viewed', label: 'Profilvisningar' },
  { key: 'signup_gate_triggered', label: 'Signup-gate' },
  { key: 'shortlist_item_saved', label: 'Sparat i lista' },
  { key: 'booking_request_sent', label: 'Förfrågningar skickade' },
  { key: 'profile_details_completed', label: 'Profiluppgifter klara' },
  { key: 'profile_published', label: 'Tjänst publicerad' },
  { key: 'provider_shared', label: 'Profil delad' },
  { key: 'shortlist_shared', label: 'Lista delad' },
  { key: 'booking_accepted', label: 'Accepterad' },
  { key: 'booking_declined', label: 'Avvisad' },
  { key: 'message_sent', label: 'Meddelande' },
  { key: 'review_submitted', label: 'Recension' },
  { key: 'provider_nominated', label: 'Nominering' },
  { key: 'portrait_generated', label: 'AI-porträtt' },
] as const

export type GrowthMetrics = {
  events: {
    key: string
    label: string
    count: number
    previous: number
    deltaPct: number | null
  }[]
  rates: {
    key: string
    label: string
    value: number | null
    hint: string
  }[]
  funnel: { label: string; count: number }[]
}

export async function getGrowthMetrics(
  supabase: SupabaseClient,
  range: AdminRange
): Promise<GrowthMetrics> {
  const { start, prevStart, prevEnd } = rangeWindows(range)

  const counts = await Promise.all(
    GROWTH_EVENTS.map(async ev => {
      const [count, previous] = await Promise.all([
        countEvents(supabase, ev.key, start),
        range === 'all'
          ? Promise.resolve(0)
          : countEvents(supabase, ev.key, prevStart, prevEnd),
      ])
      return {
        key: ev.key,
        label: ev.label,
        count,
        previous: range === 'all' ? 0 : previous,
        deltaPct: range === 'all' ? null : pctDelta(count, previous),
      }
    })
  )

  const byKey = Object.fromEntries(counts.map(c => [c.key, c.count])) as Record<
    string,
    number
  >

  const views = byKey.profile_viewed ?? 0
  const shares = byKey.provider_shared ?? 0
  const requests = byKey.booking_request_sent ?? 0
  const accepted = byKey.booking_accepted ?? 0
  const declined = byKey.booking_declined ?? 0
  const published = byKey.profile_published ?? 0
  const details = byKey.profile_details_completed ?? 0
  const reviews = byKey.review_submitted ?? 0

  const rates = [
    {
      key: 'share',
      label: 'Share rate',
      value: rate(shares, views),
      hint: 'Profiler delade ÷ visningar',
    },
    {
      key: 'request',
      label: 'Request rate',
      value: rate(requests, views),
      hint: 'Förfrågningar ÷ visningar',
    },
    {
      key: 'acceptance',
      label: 'Acceptansgrad',
      value: rate(accepted, accepted + declined),
      hint: 'Accepterade ÷ besvarade (events)',
    },
    {
      key: 'provider_funnel',
      label: 'Provider-funnel',
      value: rate(published, details),
      hint: 'Publicerade ÷ profiluppgifter klara',
    },
    {
      key: 'review',
      label: 'Review rate (events)',
      value: rate(reviews, accepted),
      hint: 'Recensioner ÷ accepterade (proxy)',
    },
  ]

  const funnel = [
    { label: 'Sökningar', count: byKey.search_performed ?? 0 },
    { label: 'Visningar', count: views },
    { label: 'Signup-gate', count: byKey.signup_gate_triggered ?? 0 },
    { label: 'Sparat', count: byKey.shortlist_item_saved ?? 0 },
    { label: 'Förfrågan', count: requests },
    { label: 'Accepterad', count: accepted },
  ]

  return { events: counts, rates, funnel }
}

export type MarketplaceMetrics = {
  supply: {
    providers: number
    withPublished: number
    unpublishedOnly: number
    publishedServices: number
    draftOrPaused: number
  }
  demand: {
    byStatus: { status: string; label: string; count: number }[]
    pendingAging: number
  }
  liquidity: {
    servicesWithRequestPct: number | null
    providersWithAcceptedPct: number | null
  }
  byCategory: { category: string; count: number }[]
}

export async function getMarketplaceMetrics(
  supabase: SupabaseClient,
  range: AdminRange
): Promise<MarketplaceMetrics> {
  const { start } = rangeWindows(range)

  const [
    providers,
    publishedServices,
    pending,
    accepted,
    declined,
    completed,
    pendingAging,
  ] = await Promise.all([
    countRows(supabase, 'provider_profiles'),
    countRows(supabase, 'services', {
      eq: { is_published: true, is_disabled: false },
    }),
    countRows(supabase, 'booking_requests', {
      since: start,
      eq: { status: 'pending' },
    }),
    countRows(supabase, 'booking_requests', {
      since: start,
      eq: { status: 'accepted' },
    }),
    countRows(supabase, 'booking_requests', {
      since: start,
      eq: { status: 'declined' },
    }),
    countRows(supabase, 'booking_requests', {
      since: start,
      eq: { status: 'completed' },
    }),
    countRows(supabase, 'booking_requests', {
      until: new Date(Date.now() - 48 * 60 * 60 * 1000),
      eq: { status: 'pending' },
    }),
  ])

  const { count: unpublishedCount } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .or('is_published.eq.false,is_disabled.eq.true')

  const { data: providerRows } = await supabase
    .from('provider_profiles')
    .select('id, services(id, is_published, is_disabled)')

  let withPublished = 0
  for (const p of providerRows ?? []) {
    const services = Array.isArray(p.services) ? p.services : p.services ? [p.services] : []
    if (
      services.some(
        (s: { is_published?: boolean; is_disabled?: boolean }) =>
          s.is_published && !s.is_disabled
      )
    ) {
      withPublished += 1
    }
  }

  const { data: serviceCats } = await supabase
    .from('services')
    .select('category_slug')
    .eq('is_published', true)
    .eq('is_disabled', false)

  const catMap = new Map<string, number>()
  for (const s of serviceCats ?? []) {
    const key = s.category_slug || 'okänd'
    catMap.set(key, (catMap.get(key) ?? 0) + 1)
  }
  const byCategory = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Liquidity: services that received ≥1 request in period
  let servicesWithRequestPct: number | null = null
  let providersWithAcceptedPct: number | null = null

  if (publishedServices > 0) {
    let reqQ = supabase.from('booking_requests').select('service_id')
    if (start) reqQ = reqQ.gte('created_at', start.toISOString())
    const { data: reqRows } = await reqQ
    const uniqueServices = new Set((reqRows ?? []).map(r => r.service_id).filter(Boolean))
    servicesWithRequestPct = rate(uniqueServices.size, publishedServices)

    let accQ = supabase
      .from('booking_requests')
      .select('service_id, services!service_id(provider_profile_id)')
      .eq('status', 'accepted')
    if (start) accQ = accQ.gte('created_at', start.toISOString())
    const { data: accRows } = await accQ
    const providerIds = new Set<string>()
    for (const row of accRows ?? []) {
      const svc = Array.isArray(row.services) ? row.services[0] : row.services
      const pid = (svc as { provider_profile_id?: string } | null)?.provider_profile_id
      if (pid) providerIds.add(pid)
    }
    if (providers > 0) {
      providersWithAcceptedPct = rate(providerIds.size, providers)
    }
  }

  return {
    supply: {
      providers,
      withPublished,
      unpublishedOnly: Math.max(0, providers - withPublished),
      publishedServices,
      draftOrPaused: unpublishedCount ?? 0,
    },
    demand: {
      byStatus: [
        { status: 'pending', label: 'Väntande', count: pending },
        { status: 'accepted', label: 'Accepterade', count: accepted },
        { status: 'declined', label: 'Avvisade', count: declined },
        { status: 'completed', label: 'Klara', count: completed },
      ],
      pendingAging,
    },
    liquidity: {
      servicesWithRequestPct,
      providersWithAcceptedPct,
    },
    byCategory,
  }
}
