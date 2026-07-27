import type { SupabaseClient } from '@supabase/supabase-js'

export type InboxMessageMeta = {
  lastMsg: {
    content: string | null
    image_url: string | null
    created_at: string
    sender_id: string
  } | null
  unread: number
}

type InboxRpcRow = {
  booking_request_id: string
  last_content: string | null
  last_image_url: string | null
  last_created_at: string | null
  last_sender_id: string | null
  unread_count: number | string | null
}

/**
 * Last message + unread per booking via SQL RPC (avoids downloading full threads).
 * Falls back to a single messages scan if the RPC is unavailable.
 */
export async function loadInboxMessageMeta(
  supabase: SupabaseClient,
  bookingIds: string[],
  viewerId: string
): Promise<Map<string, InboxMessageMeta>> {
  const result = new Map<string, InboxMessageMeta>()
  for (const id of bookingIds) {
    result.set(id, { lastMsg: null, unread: 0 })
  }
  if (bookingIds.length === 0) return result

  const { data, error } = await supabase.rpc('inbox_thread_meta', {
    p_booking_ids: bookingIds,
    p_viewer: viewerId,
  })

  if (!error && Array.isArray(data)) {
    for (const row of data as InboxRpcRow[]) {
      result.set(row.booking_request_id, {
        lastMsg:
          row.last_created_at && row.last_sender_id
            ? {
                content: row.last_content,
                image_url: row.last_image_url,
                created_at: row.last_created_at,
                sender_id: row.last_sender_id,
              }
            : null,
        unread: Number(row.unread_count ?? 0),
      })
    }
    return result
  }

  // Fallback: one scan (legacy / before migration)
  const { data: messages } = await supabase
    .from('messages')
    .select('booking_request_id, content, image_url, created_at, sender_id, read_at')
    .in('booking_request_id', bookingIds)
    .order('created_at', { ascending: false })

  for (const msg of messages ?? []) {
    const entry = result.get(msg.booking_request_id)
    if (!entry) continue
    if (!entry.lastMsg) {
      entry.lastMsg = {
        content: msg.content,
        image_url: msg.image_url,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      }
    }
    if (msg.read_at == null && msg.sender_id !== viewerId) {
      entry.unread += 1
    }
  }

  return result
}

export function formatInboxLastText(
  lastMsg: InboxMessageMeta['lastMsg'],
  viewerId: string
): string {
  if (!lastMsg) return 'Ingen konversation än'
  const body = lastMsg.content ?? 'Bild'
  return lastMsg.sender_id === viewerId ? `Du: ${body}` : body
}
