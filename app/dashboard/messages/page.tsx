import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import MessagesPanel from '@/components/messages/MessagesPanel'
import ConversationDetails from '@/components/messages/ConversationDetails'
import { type InboxThread } from '@/components/MessagesInbox'
import MessageThread from '@/app/booking/[id]/messages/MessageThread'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { fetchMessagesWithReadReceiptPrivacy } from '@/lib/messages-privacy'
import { getServicesForUser } from '@/lib/services'
import { bookingOccasionLabel } from '@/lib/booking-labels'
import { markThreadRead } from '@/lib/message-access'
import { resolveBookingCancellationPolicyId } from '@/lib/booking-cancel'
import {
  formatInboxLastText,
  loadInboxMessageMeta,
} from '@/lib/message-inbox'
import type { QuoteRecord, QuoteStatus } from '@/lib/quotes'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Meddelanden' }

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams: { c?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard/messages')

  const result = await getServicesForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceIds = result.services.map(s => s.id)
  const serviceById = new Map(result.services.map(s => [s.id, s]))

  const activeId = searchParams.c ?? null

  const [{ data: bookings }] = await Promise.all([
    serviceIds.length
      ? supabase
          .from('booking_requests')
          .select(
            'id, event_date, event_type, occasions, status, event_location, guest_count, description, planner_id, created_at, service_id, price_ore, payment_status, users!planner_id(name, avatar_url)'
          )
          .in('service_id', serviceIds)
          .in('status', ['accepted', 'completed'])
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    activeId ? markThreadRead(supabase, activeId, user.id) : Promise.resolve(),
  ])

  const bookingIds = (bookings ?? []).map(b => b.id)
  const metaByBooking = await loadInboxMessageMeta(supabase, bookingIds, user.id)

  const threadsRaw = (bookings ?? []).map(booking => {
    const meta = metaByBooking.get(booking.id)
    const planner = (
      Array.isArray(booking.users) ? booking.users[0] : booking.users
    ) as { name: string | null; avatar_url: string | null } | null
    const name = planner?.name ?? 'Arrangör'

    const thread: InboxThread = {
      id: booking.id,
      name,
      subtitle: bookingOccasionLabel(booking),
      lastText: formatInboxLastText(meta?.lastMsg ?? null, user.id),
      lastAt: meta?.lastMsg?.created_at ?? null,
      unread: meta?.unread ?? 0,
    }
    return { thread, booking, planner }
  })

  const threads = threadsRaw.map(t => t.thread)
  const active = activeId ? threadsRaw.find(t => t.thread.id === activeId) : null

  let embeddedThread: ReactNode = null
  let details: ReactNode = null

  if (active) {
    const [{ data: quoteRows }, messages] = await Promise.all([
      supabase
        .from('quotes')
        .select(
          'id, status, price_ore, description, duration, event_date, location, cancellation_policy'
        )
        .eq('booking_request_id', active.booking.id)
        .order('created_at', { ascending: false }),
      fetchMessagesWithReadReceiptPrivacy(
        supabase,
        active.booking.id,
        user.id,
        active.booking.planner_id
      ),
    ])

    const acceptedQuote = (quoteRows ?? []).find(q => q.status === 'accepted')
    const pendingQuoteRow = (quoteRows ?? []).find(q => q.status === 'pending')
    const pendingQuote: QuoteRecord | null = pendingQuoteRow
      ? {
          id: pendingQuoteRow.id,
          price_ore: pendingQuoteRow.price_ore,
          description: pendingQuoteRow.description,
          duration: pendingQuoteRow.duration,
          event_date: pendingQuoteRow.event_date,
          location: pendingQuoteRow.location,
          cancellation_policy: pendingQuoteRow.cancellation_policy,
          status: pendingQuoteRow.status as QuoteStatus,
        }
      : null
    const bookingService = active.booking.service_id
      ? serviceById.get(active.booking.service_id)
      : null
    const cancellationPolicyId = resolveBookingCancellationPolicyId({
      acceptedQuotePolicy: acceptedQuote?.cancellation_policy,
      servicePolicy: bookingService?.cancellation_policy ?? null,
    })

    embeddedThread = (
      <MessageThread
        bookingId={active.booking.id}
        currentUserId={user.id}
        messages={messages}
        otherName={active.thread.name}
        isPlanner={false}
        isProvider
        isCompleted={active.booking.status === 'completed'}
        eventDate={active.booking.event_date ?? null}
        eventLocation={active.booking.event_location ?? null}
        guestCount={active.booking.guest_count ?? null}
        eventType={active.booking.event_type ?? null}
        inquiryAt={active.booking.created_at ?? null}
        serviceId={bookingService?.id ?? active.booking.service_id ?? null}
        serviceTitle={bookingService?.title ?? null}
        embedded
      />
    )

    details = (
      <ConversationDetails
        inboxPath="/dashboard/messages"
        booking={{
          id: active.booking.id,
          status: active.booking.status,
          event_date: active.booking.event_date,
          event_type: active.booking.event_type,
          occasions: active.booking.occasions,
          event_location: active.booking.event_location,
          guest_count: active.booking.guest_count,
          description: active.booking.description,
          price_ore: active.booking.price_ore,
          payment_status: active.booking.payment_status,
          cancellationPolicyId,
        }}
        pendingQuote={pendingQuote}
        side={{
          role: 'provider',
          plannerName: active.thread.name,
          plannerAvatarUrl: active.planner?.avatar_url ?? null,
        }}
      />
    )
  }

  return (
    <ProviderHostShell flush>
      <MessagesPanel
        userId={user.id}
        threads={threads}
        activeId={activeId}
        inboxPath="/dashboard/messages"
        threadPath="/booking/:id/messages"
        conversation={embeddedThread}
        details={details}
        accent="ink"
        fillParent
      />
    </ProviderHostShell>
  )
}
