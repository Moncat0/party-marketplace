import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-server'
import { CATEGORIES, getCategoryBySlug } from '@/lib/categories'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug)
  if (!category) return {}
  return {
    title: `${category.label} i Stockholm`,
    description: category.description,
    openGraph: { title: `${category.label} i Stockholm — FESTEN.`, description: category.description },
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = getCategoryBySlug(params.slug)
  if (!category) notFound()

  const supabase = await createClient()

  // Fetch providers whose category_tags overlap with this category's tags
  const { data: providers } = await supabase
    .from('provider_profiles')
    .select(`
      id, service_title, city, photos, category_tags, created_at,
      users!user_id(name),
      reviews(rating)
    `)
    .overlaps('category_tags', category.tags)
    .order('created_at', { ascending: false })

  const enriched = (providers ?? []).map(p => {
    const reviews = (p.reviews as { rating: number }[]) ?? []
    const reviewCount = reviews.length
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null
    return { ...p, reviewCount, avgRating }
  })

  return (
    <main className="min-h-screen bg-[#FFF8F3]">

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-10 pb-6">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#1A1A2E]">FESTEN.</Link>
        <Link
          href="/signup"
          className="rounded-xl bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d2d4e] transition-colors"
        >
          Logga in
        </Link>
      </header>

      {/* Category hero */}
      <div className="px-4 mb-6">
        <p className="text-4xl mb-2">{category.emoji}</p>
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">{category.label}</h1>
        <p className="text-sm text-[#5F5E5A] leading-relaxed">{category.description}</p>
      </div>

      {/* Category chips */}
      <div className="px-4 mb-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <Link
            key={c.slug}
            href={`/kategori/${c.slug}`}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              c.slug === params.slug
                ? 'bg-[#1A1A2E] text-white'
                : 'border border-[#E8E3DC] bg-white text-[#5F5E5A] hover:bg-[#F0EDE8]'
            }`}
          >
            {c.emoji} {c.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 pb-10">
        {enriched.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl mb-2">🎭</p>
            <p className="text-sm text-[#5F5E5A] mb-4">
              Inga talanger i den här kategorin ännu. Kom tillbaka snart!
            </p>
            <Link href="/" className="text-sm font-medium text-[#FF6B35] hover:underline">
              Se alla talanger →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#5F5E5A] mb-4">{enriched.length} {enriched.length === 1 ? 'talang' : 'talanger'}</p>
            <div className="grid grid-cols-2 gap-3">
              {enriched.map(p => (
                <Link key={p.id} href={`/providers/${p.id}`} className="block group">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="relative aspect-square w-full overflow-hidden bg-[#F0EDE8]">
                      {p.photos[0] ? (
                        <Image
                          src={p.photos[0]}
                          alt={p.service_title ?? ''}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 200px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl">
                          {category.emoji}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-[#1A1A2E] truncate">
                        {p.service_title ?? 'Tjänst'}
                      </p>
                      {(p.users as any)?.name && (
                        <p className="text-xs text-[#5F5E5A] truncate">{(p.users as any).name}</p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        {p.city && (
                          <span className="text-xs text-[#5F5E5A]">📍 {p.city}</span>
                        )}
                        {p.reviewCount === 0 ? (
                          <span className="text-xs text-[#5F5E5A]">Ny</span>
                        ) : (
                          <span className="text-xs text-[#1A1A2E]">
                            ★ {p.avgRating!.toFixed(1)} ({p.reviewCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-6 flex justify-center gap-4">
        <Link href="/privacy" className="text-xs text-[#5F5E5A] hover:text-[#1A1A2E]">Integritetspolicy</Link>
        <Link href="/terms" className="text-xs text-[#5F5E5A] hover:text-[#1A1A2E]">Användarvillkor</Link>
      </div>

    </main>
  )
}
