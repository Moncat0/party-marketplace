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

  const { data: services } = await supabase
    .from('services')
    .select(
      'id, title, city, location_id, photos, category_slug, category_tags, created_at, price_range_min, provider_profiles(user_id, users(name, avatar_url)), reviews(rating)'
    )
    .eq('is_published', true)
    .eq('is_disabled', false)
    .order('created_at', { ascending: false })

  const providers = (services ?? []).map(s => {
    const provider = Array.isArray(s.provider_profiles) ? s.provider_profiles[0] : s.provider_profiles
    const users = provider
      ? Array.isArray(provider.users)
        ? (provider.users[0] ?? null)
        : provider.users
      : null
    const reviews = (s.reviews as { rating: number }[] | null) ?? []
    const reviewCount = reviews.length
    const avgRating =
      reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null
    return {
      id: s.id,
      title: s.title,
      city: s.city,
      location_id: s.location_id,
      photos: s.photos ?? [],
      category_slug: s.category_slug ?? null,
      category_tags: s.category_tags ?? [],
      created_at: s.created_at,
      price_range_min: s.price_range_min,
      users,
      reviewCount,
      avgRating,
    }
  })

  return <HomeBrowse providers={providers} isLoggedIn={!!user} plannerId={user?.id ?? null} />
}
