import type { SupabaseClient } from '@supabase/supabase-js'
import { applyReadReceiptPrivacy } from '@/lib/read-receipts'

/** Fetch thread messages and hide read receipts when the other party opted out. */
export async function fetchMessagesWithReadReceiptPrivacy(
  supabase: SupabaseClient,
  bookingId: string,
  viewerId: string,
  otherUserId: string
) {
  const [{ data: messages }, { data: other }] = await Promise.all([
    supabase
      .from('messages')
      .select('*, users!sender_id(name), quotes(*)')
      .eq('booking_request_id', bookingId)
      .order('created_at', { ascending: true }),
    supabase
      .from('users')
      .select('privacy_read_receipts')
      .eq('id', otherUserId)
      .single(),
  ])

  return applyReadReceiptPrivacy(
    messages ?? [],
    viewerId,
    otherUserId,
    other?.privacy_read_receipts ?? true
  )
}
