const STORAGE_KEY = 'festen_recently_viewed'
const MAX_ITEMS = 20

export type RecentlyViewedItem = {
  id: string
  title: string | null
  photo: string | null
  viewedAt: number
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentlyViewedItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function pushRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  const prev = getRecentlyViewed().filter(x => x.id !== item.id)
  const next = [{ ...item, viewedAt: Date.now() }, ...prev].slice(0, MAX_ITEMS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
