import type { SupabaseClient } from '@supabase/supabase-js'

export type HostReviewStats = {
  avgRating: number | null
  reviewCount: number
}

/** Average across all reviews for a host (survives service delete via reviewee_id). */
export async function getHostReviewStats(
  supabase: SupabaseClient,
  hostUserId: string
): Promise<HostReviewStats> {
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', hostUserId)

  const ratings = (data ?? []).map(r => r.rating).filter((n): n is number => typeof n === 'number')
  if (ratings.length === 0) return { avgRating: null, reviewCount: 0 }
  const sum = ratings.reduce((a, b) => a + b, 0)
  return {
    avgRating: Math.round((sum / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
  }
}

export function aggregateHostReviews(
  reviews: { rating: number | null }[] | null | undefined
): HostReviewStats {
  const ratings = (reviews ?? [])
    .map(r => r.rating)
    .filter((n): n is number => typeof n === 'number')
  if (ratings.length === 0) return { avgRating: null, reviewCount: 0 }
  const sum = ratings.reduce((a, b) => a + b, 0)
  return {
    avgRating: Math.round((sum / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
  }
}
