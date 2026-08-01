import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { CATEGORIES, getCategoryBySlug } from '@/lib/categories'
import type { Metadata } from 'next'
import Container from '@/components/Container'
import ListingCard from '@/components/listings/ListingCard'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import { HOST_USERS_SELECT, hostUserForDisplay } from '@/lib/host-display-name'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug)
  if (!category) return {}
  return {
    title: `${category.label} i Stockholm`,
    description: category.description,
    openGraph: {
      title: `${category.label} i Stockholm — FESTEN.`,
      description: category.description,
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = getCategoryBySlug(params.slug)
  if (!category) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: services } = await supabase
    .from('services')
    .select(
      `
      id, title, city, location_id, photos, category_slug, category_tags, created_at,
      provider_profiles(users(${HOST_USERS_SELECT})),
      reviews(rating)
    `
    )
    .eq('is_published', true)
    .eq('is_disabled', false)
    .eq('location_id', 'stockholm')
    .eq('category_slug', category.slug)
    .order('created_at', { ascending: false })

  const enriched = (services ?? []).map(s => {
    const reviews = (s.reviews as { rating: number }[]) ?? []
    const reviewCount = reviews.length
    const avgRating =
      reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null
    const provider = Array.isArray(s.provider_profiles) ? s.provider_profiles[0] : s.provider_profiles
    const users = provider
      ? Array.isArray(provider.users)
        ? provider.users[0]
        : provider.users
      : null
    return {
      id: s.id,
      title: s.title,
      city: s.city,
      photos: s.photos ?? [],
      category_slug: s.category_slug ?? null,
      category_tags: s.category_tags ?? [],
      users: hostUserForDisplay(users),
      reviewCount,
      avgRating,
    }
  })

  return (
    <main className="min-h-screen bg-white">
      <MarketplaceHeader currentMode="planner" />

      <Container>
        <div className="pt-8 mb-6">
          <p className="text-4xl mb-2">{category.emoji}</p>
          <h1 className="text-3xl font-bold text-[#222222] mb-2">{category.label}</h1>
          <p className="text-sm text-neutral-500 leading-relaxed">{category.description}</p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <Link
              key={c.slug}
              href={`/kategori/${c.slug}`}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                c.slug === params.slug
                  ? 'bg-[#222222] text-white'
                  : 'border border-[#DDDDDD] bg-white text-[#6A6A6A] hover:bg-[#F2F2F2]'
              }`}
            >
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>

        <div className="pb-10">
          {enriched.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">🎭</p>
              <p className="text-sm text-neutral-500 mb-4">
                Inga talanger i den här kategorin ännu. Kom tillbaka snart!
              </p>
              <Link href="/" className="text-sm font-medium text-[#FF6B35] hover:underline">
                Se alla talanger →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-500 mb-4">
                {enriched.length} {enriched.length === 1 ? 'talang' : 'talanger'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                {enriched.map(p => (
                  <ListingCard
                    key={p.id}
                    data={p}
                    isLoggedIn={!!user}
                    plannerId={user?.id ?? null}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
