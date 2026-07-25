'use client'

import { createClient } from '@/lib/supabase'

export type QuickReply = {
  id: string
  title: string
  body: string
  sort_order: number
}

const DEFAULT_REPLIES: Omit<QuickReply, 'id'>[] = [
  {
    title: 'Tack!',
    body: 'Tack för ditt meddelande! Jag återkommer så snart jag kan.',
    sort_order: 0,
  },
  {
    title: 'Kan du förtydliga?',
    body: 'Tack! Kan du förtydliga datum, plats och vad du behöver hjälp med?',
    sort_order: 1,
  },
  {
    title: 'Jag är tillgänglig',
    body: 'Jag är tillgänglig det datumet. Vill du att vi bokar in en tid för mer detaljer?',
    sort_order: 2,
  },
]

function storageKey(userId: string, kind: string) {
  return `festen_msg_${kind}_${userId}`
}

function uid() {
  return `local_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export async function loadQuickReplies(userId: string): Promise<QuickReply[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('quick_replies')
      .select('id, title, body, sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
    if (!error && data) {
      if (data.length === 0) {
        // Seed defaults once in DB
        const seeded = DEFAULT_REPLIES.map((r, i) => ({
          user_id: userId,
          title: r.title,
          body: r.body,
          sort_order: i,
        }))
        const { data: inserted } = await supabase
          .from('quick_replies')
          .insert(seeded)
          .select('id, title, body, sort_order')
        if (inserted?.length) return inserted
      } else {
        return data
      }
    }
  } catch {
    // table may not exist yet
  }

  const raw = localStorage.getItem(storageKey(userId, 'quick_replies'))
  if (raw) {
    try {
      return JSON.parse(raw) as QuickReply[]
    } catch {
      /* fall through */
    }
  }
  const local = DEFAULT_REPLIES.map((r, i) => ({ ...r, id: uid(), sort_order: i }))
  localStorage.setItem(storageKey(userId, 'quick_replies'), JSON.stringify(local))
  return local
}

export async function saveQuickReplies(userId: string, replies: QuickReply[]) {
  localStorage.setItem(storageKey(userId, 'quick_replies'), JSON.stringify(replies))
  const supabase = createClient()
  try {
    await supabase.from('quick_replies').delete().eq('user_id', userId)
    if (replies.length) {
      await supabase.from('quick_replies').insert(
        replies.map((r, i) => ({
          id: r.id.startsWith('local_') ? undefined : r.id,
          user_id: userId,
          title: r.title,
          body: r.body,
          sort_order: i,
        }))
      )
    }
  } catch {
    // local only
  }
}

export async function loadArchivedIds(userId: string): Promise<string[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('message_thread_archives')
      .select('booking_request_id')
      .eq('user_id', userId)
    if (!error && data) return data.map(r => r.booking_request_id)
  } catch {
    /* local */
  }
  const raw = localStorage.getItem(storageKey(userId, 'archived'))
  if (!raw) return []
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export async function setThreadArchived(userId: string, bookingId: string, archived: boolean) {
  const current = await loadArchivedIds(userId)
  const next = archived
    ? Array.from(new Set([...current, bookingId]))
    : current.filter(id => id !== bookingId)
  localStorage.setItem(storageKey(userId, 'archived'), JSON.stringify(next))

  const supabase = createClient()
  try {
    if (archived) {
      await supabase.from('message_thread_archives').upsert({
        user_id: userId,
        booking_request_id: bookingId,
      })
    } else {
      await supabase
        .from('message_thread_archives')
        .delete()
        .eq('user_id', userId)
        .eq('booking_request_id', bookingId)
    }
  } catch {
    /* local only */
  }
  return next
}

export async function loadSuggestedRepliesEnabled(userId: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data } = await supabase
      .from('users')
      .select('suggested_replies_enabled')
      .eq('id', userId)
      .maybeSingle()
    if (data && typeof data.suggested_replies_enabled === 'boolean') {
      return data.suggested_replies_enabled
    }
  } catch {
    /* local */
  }
  const raw = localStorage.getItem(storageKey(userId, 'suggested'))
  return raw === null ? true : raw === 'true'
}

export async function setSuggestedRepliesEnabled(userId: string, enabled: boolean) {
  localStorage.setItem(storageKey(userId, 'suggested'), String(enabled))
  const supabase = createClient()
  try {
    await supabase.from('users').update({ suggested_replies_enabled: enabled }).eq('id', userId)
  } catch {
    /* local */
  }
}

export function newQuickReply(partial?: Partial<QuickReply>): QuickReply {
  return {
    id: uid(),
    title: partial?.title ?? '',
    body: partial?.body ?? '',
    sort_order: partial?.sort_order ?? 0,
  }
}
