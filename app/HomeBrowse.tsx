'use client'

import { useState, useMemo, useEffect } from 'react'
import { CATEGORIES, resolveCategorySlug } from '@/lib/categories'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import ListingCard from '@/components/listings/ListingCard'
import ListingRow from '@/components/listings/ListingRow'
import BrowseSearch from '@/components/navbar/BrowseSearch'
import { DEFAULT_LOCATION_ID, getLocationLabel, locationIdFromCity } from '@/lib/locations'
import SiteFooter from '@/components/shared/SiteFooter'

type Provider = {
  id: string
  title: string | null
  city: string | null
  location_id?: string | null
  photos: string[]
  category_slug?: string | null
  category_tags: string[]
  created_at: string
  reviewCount: number
  avgRating: number | null
  price_range_min?: number | null
  users: { name: string | null; avatar_url: string | null } | null
}

type Props = {
  providers: Provider[]
  isLoggedIn: boolean
  plannerId: string | null
}

function toCardData(p: Provider) {
  return {
    id: p.id,
    title: p.title,
    city: p.city,
    photos: p.photos,
    category_slug: p.category_slug ?? null,
    category_tags: p.category_tags,
    users: p.users,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    price_range_min: p.price_range_min ?? null,
  }
}

export default function HomeBrowse({ providers, isLoggedIn, plannerId }: Props) {
  // Draft search criteria — homepage browse stays until user clicks Sök.
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [locationId, setLocationId] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(prev => {
          if (!prev && y > 24) return true
          if (prev && y < 8) return false
          return prev
        })
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Homepage rows default to Stockholm when no destination is drafted.
  const browseLocationId = locationId || DEFAULT_LOCATION_ID

  const inLocation = useMemo(() => {
    return providers.filter(p => {
      const id = p.location_id ?? locationIdFromCity(p.city)
      return id === browseLocationId
    })
  }, [providers, browseLocationId])

  const newest = useMemo(
    () =>
      [...inLocation]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 16),
    [inLocation]
  )

  const topRated = useMemo(
    () =>
      [...inLocation]
        .filter(p => (p.reviewCount ?? 0) >= 1 && p.avgRating != null)
        .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
        .slice(0, 16),
    [inLocation]
  )

  const rows = useMemo(() => {
    return CATEGORIES.map(cat => {
      const items = inLocation.filter(
        p =>
          resolveCategorySlug({
            category_slug: p.category_slug,
            category_tags: p.category_tags,
          }) === cat.slug
      )
      return { cat, items }
    }).filter(r => r.items.length > 0)
  }, [inLocation])

  const locationLabel = getLocationLabel(browseLocationId)

  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader
        scrolled={scrolled}
        currentMode="planner"
        center={
          <BrowseSearch
            query={query}
            onQueryChange={setQuery}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            locationId={locationId}
            onLocationChange={setLocationId}
            scrolled={scrolled}
          />
        }
      />

      <div className="pt-8 pb-10 md:pt-10 md:pb-12">
        {newest.length > 0 && (
          <ListingRow title={`Nya talanger i ${locationLabel}`}>
            {newest.map(p => (
              <ListingCard
                key={p.id}
                variant="explore"
                isLoggedIn={isLoggedIn}
                plannerId={plannerId}
                data={toCardData(p)}
              />
            ))}
          </ListingRow>
        )}

        {topRated.length > 0 && (
          <ListingRow title={`Högst betyg i ${locationLabel}`}>
            {topRated.map(p => (
              <ListingCard
                key={p.id}
                variant="explore"
                isLoggedIn={isLoggedIn}
                plannerId={plannerId}
                data={toCardData(p)}
              />
            ))}
          </ListingRow>
        )}

        {rows.map(({ cat, items }) => (
          <ListingRow
            key={cat.slug}
            title={`${cat.label} i ${locationLabel}`}
            href={`/kategori/${cat.slug}`}
          >
            {items.slice(0, 16).map(p => (
              <ListingCard
                key={p.id}
                variant="explore"
                isLoggedIn={isLoggedIn}
                plannerId={plannerId}
                data={toCardData(p)}
              />
            ))}
          </ListingRow>
        ))}

        {inLocation.length === 0 && (
          <div className="py-24 text-center px-6">
            <p className="text-4xl mb-4">🎭</p>
            <p className="text-lg font-semibold text-[#222222] mb-2">Inga talanger här än.</p>
            <p className="text-sm text-[#6A6A6A]">Kom tillbaka snart!</p>
          </div>
        )}
      </div>

      <SiteFooter isLoggedIn={isLoggedIn} />
    </div>
  )
}
