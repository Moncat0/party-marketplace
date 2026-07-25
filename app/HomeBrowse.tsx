'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { track } from '@/lib/posthog'
import { CATEGORIES } from '@/lib/categories'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import ListingCard from '@/components/listings/ListingCard'
import ListingRow, { HOME_SHELL } from '@/components/listings/ListingRow'
import BrowseSearch from '@/components/navbar/BrowseSearch'
import { DEFAULT_LOCATION_ID, getLocationLabel, locationIdFromCity } from '@/lib/locations'

type Provider = {
  id: string
  service_title: string | null
  city: string | null
  location_id?: string | null
  photos: string[]
  category_tags: string[]
  created_at: string
  user_id: string
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

function InviteFooterForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Något gick fel. Försök igen.')
    }
    setSending(false)
  }

  if (done) return <p className="text-sm text-[#FF6B35] font-medium">Inbjudan skickad!</p>

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="deras@email.se"
        required
        className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
      />
      <button
        type="submit"
        disabled={!email.trim() || sending}
        className="rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40 whitespace-nowrap"
      >
        {sending ? '...' : 'Bjud in'}
      </button>
      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
    </form>
  )
}

function toCardData(p: Provider) {
  return {
    id: p.id,
    service_title: p.service_title,
    city: p.city,
    photos: p.photos,
    category_tags: p.category_tags,
    users: p.users,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    price_range_min: p.price_range_min ?? null,
  }
}

export default function HomeBrowse({ providers, isLoggedIn, plannerId }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [locationId, setLocationId] = useState(DEFAULT_LOCATION_ID)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const inLocation = useMemo(() => {
    return providers.filter(p => {
      const id = p.location_id ?? locationIdFromCity(p.city)
      return id === locationId
    })
  }, [providers, locationId])

  const filtered = useMemo(() => {
    let list = [...inLocation]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        p =>
          p.service_title?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.category_tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (activeCategory) {
      const cat = CATEGORIES.find(c => c.slug === activeCategory)
      if (cat) {
        list = list.filter(p =>
          p.category_tags.some(t => cat.tags.map(x => x.toLowerCase()).includes(t.toLowerCase()))
        )
      }
    }
    return list
  }, [inLocation, query, activeCategory])

  useEffect(() => {
    if (!query.trim()) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      track('search_performed', {
        query,
        city: locationId,
        results_count: filtered.length,
      })
    }, 800)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const isResultsMode = !!query.trim() || !!activeCategory

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
      const items = inLocation.filter(p =>
        p.category_tags.some(t => cat.tags.map(x => x.toLowerCase()).includes(t.toLowerCase()))
      )
      return { cat, items }
    }).filter(r => r.items.length > 0)
  }, [inLocation])

  const locationLabel = getLocationLabel(locationId)

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
        {isResultsMode ? (
          <div className={HOME_SHELL}>
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-[22px] font-semibold text-[#222222] tracking-[-0.02em]">
                  {activeCategory
                    ? CATEGORIES.find(c => c.slug === activeCategory)?.label ?? 'Resultat'
                    : 'Sökresultat'}
                  {locationLabel ? ` i ${locationLabel}` : ''}
                </h1>
                <p className="text-[14px] text-[#6a6a6a] mt-1">
                  {filtered.length} {filtered.length === 1 ? 'talang' : 'talanger'}
                  {query.trim() ? ` · “${query.trim()}”` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setActiveCategory(null)
                }}
                className="text-[14px] font-semibold text-[#222] underline underline-offset-2"
              >
                Rensa
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-4xl mb-4">🎭</p>
                <p className="text-lg font-semibold text-[#222222] mb-2">Inga resultat</p>
                <p className="text-sm text-[#6A6A6A]">Prova en annan sökning eller kategori.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 min-[744px]:grid-cols-4 min-[950px]:grid-cols-5 min-[1128px]:grid-cols-6 min-[1440px]:grid-cols-7 gap-x-3 gap-y-8 md:gap-y-10">
                {filtered.map(provider => (
                  <ListingCard
                    key={provider.id}
                    isLoggedIn={isLoggedIn}
                    plannerId={plannerId}
                    data={toCardData(provider)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {newest.length > 0 && (
              <ListingRow title={`Nya talanger i ${locationLabel}`}>
                {newest.map(p => (
                  <ListingCard
                    key={p.id}
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
          </>
        )}
      </div>

      <footer className="bg-[#222222] mt-8">
        <div className={`${HOME_SHELL} py-14`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <p className="text-xl font-bold text-[#FF6B35] mb-3">FESTEN.</p>
              <p className="text-sm text-white/70 leading-relaxed max-w-xs">
                Marknadsplatsen för festunderhållning i Stockholm. Här bokar du DJ:s, fotografer,
                sminkartister och mer till ditt nästa kalas.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mt-3 max-w-xs">
                Har du en talang?{' '}
                <Link
                  href="/signup?intent=provider&next=/onboarding"
                  className="text-[#FF6B35] hover:underline font-medium"
                >
                  Erbjud din tjänst
                </Link>{' '}
                och nå fler kunder — helt gratis att komma igång.
              </p>

              {isLoggedIn && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-white mb-1">
                    Känner du någon som borde vara här?
                  </p>
                  <p className="text-xs text-white/50 mb-3">
                    Bjud in en artist, fotograf eller kock till FESTEN.
                  </p>
                  <InviteFooterForm />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Kategorier
              </p>
              <ul className="space-y-3">
                {CATEGORIES.slice(0, 4).map(c => (
                  <li key={c.slug}>
                    <Link
                      href={`/kategori/${c.slug}`}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                &nbsp;
              </p>
              <ul className="space-y-3">
                {CATEGORIES.slice(4).map(c => (
                  <li key={c.slug}>
                    <Link
                      href={`/kategori/${c.slug}`}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Info
              </p>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/sa-funkar-det"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Så funkar det
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-talanger"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    För talanger
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup?intent=planner"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Logga in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/hjalp"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Hjälpcenter
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Integritetspolicy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Användarvillkor
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/30">© 2026 FESTEN. Stockholm</p>
            <p className="text-xs text-white/30">Gjord med kärlek för kalas 🎉</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
