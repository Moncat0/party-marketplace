import { createClient } from '@/lib/supabase'

export type WishlistSummary = {
  id: string
  name: string
  share_token: string
  created_at: string
  item_count: number
  cover_photos: string[]
}

export async function fetchUserWishlists(plannerId: string): Promise<WishlistSummary[]> {
  const supabase = createClient()
  const { data: lists } = await supabase
    .from('shortlists')
    .select('id, name, share_token, created_at')
    .eq('planner_id', plannerId)
    .order('created_at', { ascending: false })

  if (!lists?.length) return []

  const ids = lists.map(l => l.id)
  const { data: items } = await supabase
    .from('shortlist_items')
    .select('shortlist_id, added_at, provider_profiles(photos)')
    .in('shortlist_id', ids)
    .order('added_at', { ascending: false })

  const byList = new Map<string, { count: number; photos: string[] }>()
  for (const id of ids) byList.set(id, { count: 0, photos: [] })

  for (const item of items ?? []) {
    const entry = byList.get(item.shortlist_id)
    if (!entry) continue
    entry.count += 1
    if (entry.photos.length >= 4) continue
    const raw = item.provider_profiles as
      | { photos: string[] | null }
      | { photos: string[] | null }[]
      | null
    const profile = Array.isArray(raw) ? raw[0] : raw
    const photo = profile?.photos?.[0]
    if (photo) entry.photos.push(photo)
  }

  return lists.map(list => {
    const meta = byList.get(list.id) ?? { count: 0, photos: [] }
    return {
      id: list.id,
      name: list.name || 'Favoriter',
      share_token: list.share_token,
      created_at: list.created_at,
      item_count: meta.count,
      cover_photos: meta.photos,
    }
  })
}

export async function createWishlist(plannerId: string, name: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shortlists')
    .insert({ planner_id: plannerId, name: name.trim() || 'Favoriter' })
    .select('id, name, share_token, created_at')
    .single()
  if (error) throw error
  return data
}

export async function addToWishlist(shortlistId: string, providerProfileId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('shortlist_items').upsert(
    { shortlist_id: shortlistId, provider_profile_id: providerProfileId },
    { onConflict: 'shortlist_id,provider_profile_id' }
  )
  if (error) throw error
}

export async function removeFromAllWishlists(plannerId: string, providerProfileId: string) {
  const supabase = createClient()
  const { data: lists } = await supabase
    .from('shortlists')
    .select('id')
    .eq('planner_id', plannerId)
  if (!lists?.length) return
  await supabase
    .from('shortlist_items')
    .delete()
    .eq('provider_profile_id', providerProfileId)
    .in(
      'shortlist_id',
      lists.map(l => l.id)
    )
}

export async function isProviderSaved(plannerId: string, providerProfileId: string) {
  const supabase = createClient()
  const { data: lists } = await supabase
    .from('shortlists')
    .select('id')
    .eq('planner_id', plannerId)
  if (!lists?.length) return false
  const { data } = await supabase
    .from('shortlist_items')
    .select('id')
    .eq('provider_profile_id', providerProfileId)
    .in(
      'shortlist_id',
      lists.map(l => l.id)
    )
    .limit(1)
    .maybeSingle()
  return !!data
}

export async function renameWishlist(shortlistId: string, name: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('shortlists')
    .update({ name: name.trim() || 'Favoriter' })
    .eq('id', shortlistId)
  if (error) throw error
}

export async function deleteWishlist(shortlistId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('shortlists').delete().eq('id', shortlistId)
  if (error) throw error
}

export async function updateWishlistMeta(
  shortlistId: string,
  patch: { event_date?: string | null; guest_count?: number | null }
) {
  const supabase = createClient()
  const { error } = await supabase.from('shortlists').update(patch).eq('id', shortlistId)
  if (error) throw error
}

export async function updateItemNote(itemId: string, note: string | null) {
  const supabase = createClient()
  const { error } = await supabase
    .from('shortlist_items')
    .update({ note: note?.trim() || null })
    .eq('id', itemId)
  if (error) throw error
}

export async function removeWishlistItem(itemId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('shortlist_items').delete().eq('id', itemId)
  if (error) throw error
}
