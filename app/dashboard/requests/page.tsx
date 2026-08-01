import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import RequestsList, { type ProviderRequest } from './RequestsList'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServicesForUser } from '@/lib/services'
import { loadInboxMessageMeta } from '@/lib/message-inbox'
import { type QuoteRecord, type QuoteStatus } from '@/lib/quotes'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Förfrågningar' }

type QuoteRow = {
  id: string
  status: string
  price_ore: number
  description: string | null
  duration: string | null
  event_date: string | null
  location: string | null
  cancellation_policy: string | null
}

export default async function RequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard/requests')

  const result = await getServicesForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceIds = result.services.map(s => s.id)

  const { data: rawRequests } = serviceIds.length
    ? await supabase
        .from('booking_requests')
        .select(
          `
          *,
          users!planner_id(id, name, email),
          services!service_id(title),
          quotes(id, status, price_ore, description, duration, event_date, location, cancellation_policy)
        `
        )
        .in('service_id', serviceIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const bookingIds = (rawRequests ?? []).map(r => r.id)
  const metaByBooking = await loadInboxMessageMeta(supabase, bookingIds, user.id)

  const requests: ProviderRequest[] = (rawRequests ?? []).map(row => {
    const quotes = (row.quotes ?? []) as QuoteRow[]
    const pendingQuoteRow = quotes.find(q => q.status === 'pending') ?? null
    const pendingQuote: QuoteRecord | null = pendingQuoteRow
      ? {
          ...pendingQuoteRow,
          status: pendingQuoteRow.status as QuoteStatus,
        }
      : null
    const hasOffer = quotes.some(q => q.status === 'pending' || q.status === 'accepted')
    const serviceRaw = row.services as unknown
    const service = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as {
      title: string | null
    } | null
    const acceptedQuote = quotes.find(q => q.status === 'accepted')

    return {
      id: row.id,
      status: row.status,
      event_date: row.event_date,
      event_type: row.event_type,
      occasions: row.occasions,
      event_location: row.event_location,
      guest_count: row.guest_count,
      description: row.description,
      created_at: row.created_at,
      price_ore: row.price_ore,
      payment_status: row.payment_status,
      unread: metaByBooking.get(row.id)?.unread ?? 0,
      hasOffer,
      pendingQuote,
      acceptedQuotePolicy: acceptedQuote?.cancellation_policy ?? null,
      defaultCancellationPolicy: 'moderate',
      users: (Array.isArray(row.users) ? row.users[0] : row.users) as ProviderRequest['users'],
      services: service,
    }
  })

  return (
    <ProviderHostShell wide>
      <RequestsList requests={requests} />
    </ProviderHostShell>
  )
}
