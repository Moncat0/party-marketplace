import { createClient } from '@/lib/supabase'

export type WishlistSummary = {
  id: string
  name: string
  share_token: string
  created_at: string
  item_count: number
  cover_photos: string[]
}

type CacheEntry = { lists: WishlistSummary[]; fetchedAt: number }

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<WishlistSummary[]>>()

/** Instant read for modal open — null if never fetched this session. */
export function getCachedWishlists(plannerId: string): WishlistSummary[] | null {
  return cache.get(plannerId)?.lists ?? null
}

export function setWishlistCache(plannerId: string, lists: WishlistSummary[]) {
  cache.set(plannerId, { lists, fetchedAt: Date.now() })
}

export function invalidateWishlistCache(plannerId?: string) {
  if (plannerId) cache.delete(plannerId)
  else cache.clear()
}

async function fetchUserWishlistsFromNetwork(
  plannerId: string
): Promise<WishlistSummary[]> {
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
    .select('shortlist_id, added_at, services(photos)')
    .in('shortlist_id', ids)
    .order('added_at', { ascending: false })

  const byList = new Map<string, { count: number; photos: string[] }>()
  for (const id of ids) byList.set(id, { count: 0, photos: [] })

  for (const item of items ?? []) {
    const entry = byList.get(item.shortlist_id)
    if (!entry) continue
    entry.count += 1
    if (entry.photos.length >= 4) continue
    const raw = item.services as
      | { photos: string[] | null }
      | { photos: string[] | null }[]
      | null
    const service = Array.isArray(raw) ? raw[0] : raw
    const photo = service?.photos?.[0]
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

/**
 * Fetch wishlists with in-memory cache + in-flight dedupe.
 * Prefetch before opening the modal so the picker doesn’t flash a skeleton.
 */
export async function fetchUserWishlists(
  plannerId: string,
  opts?: { force?: boolean }
): Promise<WishlistSummary[]> {
  if (!opts?.force) {
    const hit = cache.get(plannerId)
    if (hit) return hit.lists
    const pending = inflight.get(plannerId)
    if (pending) return pending
  }

  const existing = inflight.get(plannerId)
  if (existing && !opts?.force) return existing

  const promise = fetchUserWishlistsFromNetwork(plannerId)
    .then(lists => {
      setWishlistCache(plannerId, lists)
      inflight.delete(plannerId)
      return lists
    })
    .catch(err => {
      inflight.delete(plannerId)
      throw err
    })

  inflight.set(plannerId, promise)
  return promise
}

/** Fire-and-forget warm of the cache (hover / page mount). */
export function prefetchUserWishlists(plannerId: string) {
  void fetchUserWishlists(plannerId)
}

export async function createWishlist(plannerId: string, name: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shortlists')
    .insert({ planner_id: plannerId, name: name.trim() || 'Favoriter' })
    .select('id, name, share_token, created_at')
    .single()
  if (error) throw error
  invalidateWishlistCache(plannerId)
  return data
}

export async function addToWishlist(shortlistId: string, serviceId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('shortlist_items').upsert(
    { shortlist_id: shortlistId, service_id: serviceId },
    { onConflict: 'shortlist_id,service_id' }
  )
  if (error) throw error
  // Counts / covers changed — planner id isn’t known here.
  invalidateWishlistCache()
}

export async function removeFromAllWishlists(plannerId: string, serviceId: string) {
  const supabase = createClient()
  const { data: lists } = await supabase
    .from('shortlists')
    .select('id')
    .eq('planner_id', plannerId)
  if (!lists?.length) return
  await supabase
    .from('shortlist_items')
    .delete()
    .eq('service_id', serviceId)
    .in(
      'shortlist_id',
      lists.map(l => l.id)
    )
  invalidateWishlistCache(plannerId)
}

export async function isProviderSaved(plannerId: string, serviceId: string) {
  const supabase = createClient()
  const { data: lists } = await supabase
    .from('shortlists')
    .select('id')
    .eq('planner_id', plannerId)
  if (!lists?.length) return false
  const { data } = await supabase
    .from('shortlist_items')
    .select('id')
    .eq('service_id', serviceId)
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
  invalidateWishlistCache()
}

export async function deleteWishlist(shortlistId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('shortlists').delete().eq('id', shortlistId)
  if (error) throw error
  invalidateWishlistCache()
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
  invalidateWishlistCache()
}
