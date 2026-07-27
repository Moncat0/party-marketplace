import type { SupabaseClient } from '@supabase/supabase-js'

export const MESSAGING_BOOKING_STATUSES = ['accepted', 'completed'] as const

export type MessagingBookingStatus = (typeof MESSAGING_BOOKING_STATUSES)[number]

export function isMessagingAllowedStatus(
  status: string | null | undefined
): status is MessagingBookingStatus {
  return !!status && (MESSAGING_BOOKING_STATUSES as readonly string[]).includes(status)
}

type BookingAccessRow = {
  id: string
  status: string
  planner_id: string
  services:
    | { provider_profiles: { user_id: string } | { user_id: string }[] | null }
    | { provider_profiles: { user_id: string } | { user_id: string }[] | null }[]
    | null
}

function unwrapProviderUserId(booking: BookingAccessRow): string | null {
  const serviceRaw = booking.services
  const service = Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw
  const profile = service?.provider_profiles
    ? Array.isArray(service.provider_profiles)
      ? service.provider_profiles[0]
      : service.provider_profiles
    : null
  return profile?.user_id ?? null
}

/**
 * Load booking + verify the user is a participant.
 * Optionally require accepted|completed for send paths.
 */
export async function getBookingMessageAccess(
  supabase: SupabaseClient,
  bookingId: string,
  userId: string,
  opts?: { requireOpenThread?: boolean }
): Promise<
  | {
      ok: true
      booking: BookingAccessRow
      isPlanner: boolean
      isProvider: boolean
      providerUserId: string
    }
  | { ok: false; status: 403 | 404 | 409; error: string }
> {
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('id, status, planner_id, services!service_id(provider_profiles(user_id))')
    .eq('id', bookingId)
    .maybeSingle()

  if (!booking) return { ok: false, status: 404, error: 'Not found' }

  const row = booking as unknown as BookingAccessRow
  const providerUserId = unwrapProviderUserId(row)
  if (!providerUserId) return { ok: false, status: 404, error: 'Not found' }

  const isPlanner = userId === row.planner_id
  const isProvider = userId === providerUserId
  if (!isPlanner && !isProvider) return { ok: false, status: 403, error: 'Forbidden' }

  if (opts?.requireOpenThread && !isMessagingAllowedStatus(row.status)) {
    return {
      ok: false,
      status: 409,
      error: 'Meddelanden är endast tillgängliga för accepterade bokningar.',
    }
  }

  return { ok: true, booking: row, isPlanner, isProvider, providerUserId }
}

/** Mark inbound messages in a thread as read for the viewer. */
export async function markThreadRead(
  supabase: SupabaseClient,
  bookingId: string,
  viewerId: string
): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('booking_request_id', bookingId)
    .is('read_at', null)
    .neq('sender_id', viewerId)
}
