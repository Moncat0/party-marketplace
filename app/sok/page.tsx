import { createClient } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import SearchResults from './SearchResults'
import { getCategoryBySlug } from '@/lib/categories'
import { getLocationLabel } from '@/lib/locations'
import { formatOccasion } from '@/lib/occasions'
import { HOST_USERS_SELECT, hostUserForDisplay } from '@/lib/host-display-name'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: {
    location?: string
    category?: string
    occasion?: string
    q?: string
    sort?: string
    travel?: string
    rating?: string
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const cat = searchParams.category ? getCategoryBySlug(searchParams.category) : null
  const loc = searchParams.location ? getLocationLabel(searchParams.location) : null
  const occasion = searchParams.occasion ? formatOccasion(searchParams.occasion) : null
  const parts = [
    cat?.label ?? 'Tjänster',
    occasion,
    loc ? `i ${loc}` : null,
  ].filter(Boolean)
  return {
    title: `${parts.join(' · ')} — FESTEN.`,
    description: cat?.description ?? 'Hitta lokala talanger till ditt kalas.',
  }
}

export default async function SokPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: services } = await supabase
    .from('services')
    .select(
      `id, title, city, location_id, can_travel, photos, category_slug, category_tags, occasions, created_at, price_range_min, provider_profiles(users(${HOST_USERS_SELECT})), reviews(rating)`
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
      can_travel: !!s.can_travel,
      photos: s.photos ?? [],
      category_slug: s.category_slug ?? null,
      category_tags: s.category_tags ?? [],
      occasions: (s.occasions as string[] | null) ?? [],
      created_at: s.created_at,
      price_range_min: s.price_range_min,
      users: hostUserForDisplay(users),
      reviewCount,
      avgRating,
    }
  })

  return (
    <SearchResults
      providers={providers}
      isLoggedIn={!!user}
      plannerId={user?.id ?? null}
      initialLocationId={searchParams.location ?? ''}
      initialCategory={searchParams.category ?? null}
      initialOccasion={searchParams.occasion ?? null}
      initialQuery={searchParams.q ?? ''}
      initialSort={searchParams.sort ?? 'relevant'}
      initialCanTravelOnly={searchParams.travel === '1'}
      initialReviewFilter={searchParams.rating}
    />
  )
}
