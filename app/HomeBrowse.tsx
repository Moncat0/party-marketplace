'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_GROUPS } from '@/lib/categories'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import ListingCard from '@/components/listings/ListingCard'
import SiteFooter from '@/components/shared/SiteFooter'
import { DEFAULT_LOCATION_ID, getLocationLabel, locationIdFromCity } from '@/lib/locations'
import { Search } from 'lucide-react'

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
  fontClass?: string
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

function HeroSearch() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [service, setService] = useState('')

  function handleSearch() {
    const params = new URLSearchParams()
    if (location.trim()) params.set('q', location.trim())
    if (service.trim()) params.set('q', service.trim())
    router.push(`/sok${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="flex items-center bg-white border border-[#e8ddce] rounded-full px-2 py-2 shadow-sm max-w-[480px] w-full">
      <button
        onClick={handleSearch}
        className="flex-1 text-left px-5"
      >
        <p className="text-[13px] font-bold text-[#111] leading-none">Var</p>
        <p className="text-[13px] text-[#5c5c5c] mt-0.5">Sök i Stockholm</p>
      </button>
      <div className="w-px h-8 bg-[#e8ddce] flex-shrink-0" />
      <button
        onClick={handleSearch}
        className="flex-1 text-left px-5"
      >
        <p className="text-[13px] font-bold text-[#111] leading-none">Tjänst</p>
        <p className="text-[13px] text-[#5c5c5c] mt-0.5">Alla kategorier</p>
      </button>
      <button
        onClick={handleSearch}
        className="w-11 h-11 rounded-full bg-[#FF2E8A] flex items-center justify-center flex-shrink-0 hover:bg-[#e01f74] transition-colors"
        aria-label="Sök"
      >
        <Search className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
      </button>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    q: 'Kostar det något?',
    a: 'Nej. Gratis att bläddra, spara och boka. Alltid.',
  },
  {
    q: 'Hur vet jag att leverantören faktiskt är bra?',
    a: 'Vi granskar varje leverantör innan profilen går live — riktiga bilder, riktig kontaktinfo, en verklig verksamhet bakom profilen.',
  },
  {
    q: 'Vad händer om jag måste ställa in festen?',
    a: 'Leverantören sätter sin egen avbokningspolicy — Flexibel, Måttlig eller Strikt — och du ser den innan du bokar.',
  },
]

export default function HomeBrowse({ providers, isLoggedIn, plannerId, fontClass }: Props) {
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
      return id === DEFAULT_LOCATION_ID
    })
  }, [providers])

  const newest = useMemo(
    () =>
      [...inLocation]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 8),
    [inLocation]
  )

  const topRated = useMemo(
    () =>
      [...inLocation]
        .filter(p => (p.reviewCount ?? 0) >= 1 && p.avgRating != null)
        .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
        .slice(0, 8),
    [inLocation]
  )

  const locationLabel = getLocationLabel(DEFAULT_LOCATION_ID)

  return (
    <div className={`min-h-screen bg-white ${fontClass ?? ''}`}>
      <MarketplaceHeader scrolled={scrolled} currentMode="planner" />

      {/* ── Hero ── */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-10 pt-14 pb-10 text-center">
        <h1
          className="text-[42px] md:text-[64px] font-black leading-[1.02] tracking-tight text-[#111] mb-6"
          style={{ fontFamily: 'var(--font-home-display, inherit)' }}
        >
          Stockholms bästa.<br />Precis här.
        </h1>
        <p className="text-[17px] md:text-[19px] text-[#5c5c5c] leading-relaxed max-w-[560px] mx-auto mb-8">
          Allt som gör festen av — fotografer, DJs, catering och mer. Bläddra, spara, skicka förfrågan. Helt gratis.
        </p>
        <div className="flex justify-center mb-10">
          <HeroSearch />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORY_GROUPS.map(group => (
            <a
              key={group.id}
              href={`/kategori/${group.slugs[0]}`}
              className="inline-flex items-center gap-2 bg-white border border-[#e8ddce] rounded-full px-5 py-3 text-[15px] font-semibold text-[#111] shadow-sm hover:border-[#FF2E8A] hover:shadow-md transition-all duration-150 no-underline"
            >
              {group.label}
            </a>
          ))}
          <a
            href="/sok"
            className="inline-flex items-center gap-2 bg-[#111] border border-[#111] rounded-full px-5 py-3 text-[15px] font-semibold text-white transition-all duration-150 no-underline"
          >
            Fler →
          </a>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="border-t border-b border-[#e8ddce] py-5 flex items-center justify-center gap-3 text-[15px] mx-5 md:mx-10 mb-16">
        <span className="font-bold text-[#111]">Gratis. Alltid.</span>
        <span className="text-[#e8ddce]">·</span>
        <span className="text-[#5c5c5c]">Verifierade proffs i Stockholm.</span>
      </div>

      {/* ── Listings ── */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pb-20">

        {/* Nya talanger */}
        {newest.length > 0 && (
          <section className="mb-14">
            <h2
              className="text-[28px] md:text-[36px] font-black tracking-tight text-[#111] mb-7 uppercase"
              style={{ fontFamily: 'var(--font-home-display, inherit)' }}
            >
              Nya talanger i {locationLabel}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {newest.slice(0, 4).map(p => (
                <ListingCard
                  key={p.id}
                  variant="services"
                  isLoggedIn={isLoggedIn}
                  plannerId={plannerId}
                  data={toCardData(p)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Favoriterna */}
        {topRated.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-7">
              <h2
                className="text-[28px] md:text-[36px] font-black tracking-tight text-[#111] uppercase"
                style={{ fontFamily: 'var(--font-home-display, inherit)' }}
              >
                Favoriterna
              </h2>
              <a
                href="/sok"
                className="text-[15px] font-semibold text-[#111] flex items-center gap-1 no-underline hover:opacity-70 transition-opacity"
              >
                Visa alla
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {topRated.slice(0, 4).map(p => (
                <ListingCard
                  key={p.id}
                  variant="services"
                  isLoggedIn={isLoggedIn}
                  plannerId={plannerId}
                  data={toCardData(p)}
                />
              ))}
            </div>
          </section>
        )}

        {inLocation.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-[#111] mb-2">Inga talanger här än.</p>
            <p className="text-sm text-[#5c5c5c]">Kom tillbaka snart!</p>
          </div>
        )}

        {/* ── Så funkar det ── */}
        <section className="py-16 border-t border-[#e8ddce]">
          <h2
            className="text-[28px] md:text-[36px] font-black tracking-tight text-[#111] mb-10 uppercase"
            style={{ fontFamily: 'var(--font-home-display, inherit)' }}
          >
            Så funkar det
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Bläddra', body: 'Fotografer, DJs, catering och mer — allt på ett ställe.' },
              { n: '2', title: 'Spara', body: 'Gilla det du ser. Bygg din shortlist för kvällen.' },
              { n: '3', title: 'Boka', body: 'Skicka förfrågan, få svar, klart. Festen är bokad.' },
            ].map(step => (
              <div key={step.n}>
                <div className="w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center text-[15px] font-bold mb-4">
                  {step.n}
                </div>
                <h3 className="text-[20px] font-bold text-[#111] mb-2">{step.title}</h3>
                <p className="text-[14px] text-[#5c5c5c] leading-normal">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="pb-16 max-w-[720px] mx-auto">
          <h2
            className="text-[28px] md:text-[36px] font-black tracking-tight text-[#111] mb-10 text-center uppercase"
            style={{ fontFamily: 'var(--font-home-display, inherit)' }}
          >
            Vanliga frågor
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map(item => (
              <details
                key={item.q}
                className="bg-white border border-[#e8ddce] rounded-xl px-5 py-[18px] group"
              >
                <summary className="flex items-center justify-between font-bold text-[16px] text-[#111] cursor-pointer list-none">
                  {item.q}
                  <span className="text-[20px] text-[#5c5c5c] group-open:rotate-45 transition-transform duration-150 select-none ml-4 flex-shrink-0">+</span>
                </summary>
                <p className="text-[14px] text-[#5c5c5c] leading-normal mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-[#111] rounded-2xl px-8 py-16 text-center mb-16">
          <h2
            className="text-[28px] md:text-[44px] font-black text-white mb-4 uppercase"
            style={{ fontFamily: 'var(--font-home-display, inherit)' }}
          >
            Nästa fest väntar.
          </h2>
          <p className="text-[16px] text-white/70 mb-8">Gå och hitta dina talanger.</p>
          <a
            href="/sok"
            className="inline-block bg-[#FF2E8A] hover:bg-[#e01f74] text-white font-bold text-[16px] px-8 py-4 rounded-full transition-colors no-underline"
          >
            Vad planerar du?
          </a>
        </section>
      </div>

      <SiteFooter isLoggedIn={isLoggedIn} />
    </div>
  )
}
