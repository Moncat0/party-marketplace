import { createClient } from '@/lib/supabase-server'
import HomeBrowse from './HomeBrowse'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FESTEN. — Hitta underhållning till ditt kalas',
  description: 'Boka lokala artister, fotografer, kockar och mer till ditt nästa kalas i Stockholm. Gratis att använda.',
  openGraph: {
    title: 'FESTEN. — Hitta underhållning till ditt kalas',
    description: 'Boka lokala artister, fotografer, kockar och mer till ditt nästa kalas i Stockholm.',
    url: '/',
  },
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from('provider_profiles')
    .select('id, service_title, city, location_id, photos, category_tags, created_at, user_id, price_range_min, users(name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const { data: reviews } = await supabase
    .from('reviews')
    .select('reviewee_id, rating')

  const reviewMap: Record<string, { count: number; total: number }> = {}
  reviews?.forEach(r => {
    if (!reviewMap[r.reviewee_id]) reviewMap[r.reviewee_id] = { count: 0, total: 0 }
    reviewMap[r.reviewee_id].count++
    reviewMap[r.reviewee_id].total += r.rating
  })

  const providers = (profiles ?? []).map(p => ({
    ...p,
    users: Array.isArray(p.users) ? (p.users[0] ?? null) : p.users,
    reviewCount: reviewMap[p.user_id]?.count ?? 0,
    avgRating: reviewMap[p.user_id]
      ? reviewMap[p.user_id].total / reviewMap[p.user_id].count
      : null,
  }))

  return <HomeBrowse providers={providers} isLoggedIn={!!user} plannerId={user?.id ?? null} />
}
