'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { track } from '@/lib/posthog'
import { CATEGORIES } from '@/lib/categories'

type Provider = {
  id: string
  service_title: string | null
  city: string | null
  photos: string[]
  category_tags: string[]
  created_at: string
  user_id: string
  reviewCount: number
  avgRating: number | null
  users: { name: string | null; avatar_url: string | null } | null
}

type Props = {
  providers: Provider[]
  isLoggedIn: boolean
  dashboardHref?: string
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

function InviteForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
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
      body: JSON.stringify({ email: email.trim(), message: message.trim() || null }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Något gick fel. Försök igen.')
    }
    setSending(false)
  }

  if (!isLoggedIn) return null

  return (
    <div className="mt-16 rounded-3xl bg-[#1A1A2E] px-8 py-10 text-white max-w-xl mx-auto text-center">
      <p className="text-lg font-semibold mb-1">Känner du någon som borde vara här?</p>
      <p className="text-sm text-white/60 mb-6">Bjud in en artist, fotograf eller kock till FESTEN.</p>
      {done ? (
        <p className="text-sm text-[#FF6B35] font-medium">Inbjudan skickad!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="deras@email.se"
            required
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          />
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Lägg till ett personligt meddelande... (valfritt)"
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={!email.trim() || sending}
            className="w-full rounded-xl bg-[#FF6B35] py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-40"
          >
            {sending ? 'Skickar...' : 'Skicka inbjudan'}
          </button>
        </form>
      )}
    </div>
  )
}

function ProviderCard({ provider }: { provider: Provider }) {
  const photo = provider.photos[0]

  return (
    <Link href={`/providers/${provider.id}`} className="block group">
      {/* Photo */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F0EDE8] mb-3">
        {photo ? (
          <Image
            src={photo}
            alt={provider.service_title ?? ''}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-5xl">🎉</div>
        )}
      </div>

      {/* Text — Airbnb style: no card border, just clean text below photo */}
      <div className="space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[#1A1A2E] text-sm leading-snug line-clamp-1">
            {provider.service_title ?? 'Tjänst'}
          </p>
          {provider.avgRating !== null && (
            <span className="text-sm text-[#1A1A2E] flex-shrink-0 flex items-center gap-0.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#1A1A2E"><path d="M6 1l1.39 2.82 3.11.45-2.25 2.19.53 3.09L6 8.1 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45z"/></svg>
              {provider.avgRating.toFixed(1)}
            </span>
          )}
        </div>
        {provider.users?.name && (
          <p className="text-sm text-[#717171] line-clamp-1">{provider.users.name}</p>
        )}
        <p className="text-sm text-[#717171]">
          {provider.city ?? 'Stockholm'}
          {provider.reviewCount === 0 && ' · Ny på plattformen'}
          {provider.reviewCount > 0 && ` · ${provider.reviewCount} ${provider.reviewCount === 1 ? 'recension' : 'recensioner'}`}
        </p>
      </div>
    </Link>
  )
}

export default function HomeBrowse({ providers, isLoggedIn, dashboardHref = '/dashboard' }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<'newest' | 'most_reviewed'>('newest')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!query.trim()) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      track('search_performed', { query, results_count: filtered.length })
    }, 800)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...providers]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p =>
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
    if (sort === 'most_reviewed') {
      list.sort((a, b) => b.reviewCount - a.reviewCount)
    }
    return list
  }, [providers, query, activeCategory, sort])

  return (
    <div className="min-h-screen bg-white">

      {/* ── STICKY HEADER ── */}
      <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'border-b border-[#EBEBEB]'}`}>
        <div className="mx-auto max-w-[1760px] px-6 lg:px-10">
          <div className="flex items-center h-20 gap-4">

            {/* Logo */}
            <div className="flex-shrink-0 w-32">
              <span className="text-xl font-bold tracking-tight text-[#FF6B35]">FESTEN.</span>
            </div>

            {/* Search bar — center */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-md">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717171]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Sök DJ, fotograf, sångare..."
                  className="w-full rounded-full border border-[#DDDDDD] bg-white pl-11 pr-5 py-3 text-sm text-[#1A1A2E] placeholder-[#717171] shadow-sm hover:shadow-md focus:outline-none focus:shadow-md transition-shadow"
                />
              </div>
            </div>

            {/* Nav actions — right */}
            <div className="flex-shrink-0 flex items-center justify-end gap-2">
              {isLoggedIn ? (
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 rounded-full border border-[#DDDDDD] px-4 py-2.5 text-sm font-medium text-[#1A1A2E] hover:shadow-md transition-shadow whitespace-nowrap"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  <span>Min sida</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-[#1A1A2E] hover:bg-[#F7F7F7] transition-colors whitespace-nowrap"
                  >
                    Logga in
                  </Link>
                  <Link
                    href="/onboarding"
                    className="rounded-full bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors whitespace-nowrap"
                  >
                    Erbjud din tjänst
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── CATEGORY FILTER BAR ── */}
      <div className="sticky top-20 z-40 bg-white border-b border-[#EBEBEB]">
        <div className="mx-auto max-w-[1760px] px-6 lg:px-10">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-4">
            {/* All */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-1 rounded-full text-xs font-medium transition-colors border ${
                activeCategory === null
                  ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white'
                  : 'border-transparent text-[#717171] hover:border-[#DDDDDD] hover:text-[#1A1A2E]'
              }`}
            >
              <span className="text-base">✨</span>
              <span>Alla</span>
            </button>

            {CATEGORIES.map(c => (
              <button
                key={c.slug}
                onClick={() => setActiveCategory(activeCategory === c.slug ? null : c.slug)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-1 rounded-full text-xs font-medium transition-colors border ${
                  activeCategory === c.slug
                    ? 'border-[#1A1A2E] bg-[#1A1A2E] text-white'
                    : 'border-transparent text-[#717171] hover:border-[#DDDDDD] hover:text-[#1A1A2E]'
                }`}
              >
                <span className="text-base">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}

            {/* Sort — right side */}
            <div className="ml-auto flex-shrink-0 flex items-center gap-1 pl-4 border-l border-[#EBEBEB]">
              <button
                onClick={() => setSort('newest')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === 'newest' ? 'bg-[#1A1A2E] text-white' : 'text-[#717171] hover:bg-[#F7F7F7]'
                }`}
              >
                Nyast
              </button>
              <button
                onClick={() => setSort('most_reviewed')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === 'most_reviewed' ? 'bg-[#1A1A2E] text-white' : 'text-[#717171] hover:bg-[#F7F7F7]'
                }`}
              >
                Mest recenserade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <main className="mx-auto max-w-[1760px] px-6 lg:px-10 py-8">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl mb-4">🎭</p>
            <p className="text-lg font-semibold text-[#1A1A2E] mb-2">
              {query ? 'Inga resultat för din sökning.' : 'Inga talanger här än.'}
            </p>
            <p className="text-sm text-[#717171]">
              {query ? 'Prova ett annat sökord.' : 'Kom tillbaka snart!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
            {filtered.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A1A2E] mt-16">
        <div className="mx-auto max-w-[1760px] px-6 lg:px-10 py-14">

          {/* Top: brand blurb + columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

            {/* Brand column — spans 2 */}
            <div className="md:col-span-2">
              <p className="text-xl font-bold text-[#FF6B35] mb-3">FESTEN.</p>
              <p className="text-sm text-white/70 leading-relaxed max-w-xs">
                Marknadsplatsen för festunderhållning i Stockholm. Här bokar du DJ:s, fotografer, sminkartister och mer till ditt nästa kalas.
              </p>
              <p className="text-sm text-white/70 leading-relaxed mt-3 max-w-xs">
                Har du en talang? <Link href="/onboarding" className="text-[#FF6B35] hover:underline font-medium">Erbjud din tjänst</Link> och nå fler kunder — helt gratis att komma igång.
              </p>

              {isLoggedIn && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-white mb-1">Känner du någon som borde vara här?</p>
                  <p className="text-xs text-white/50 mb-3">Bjud in en artist, fotograf eller kock till FESTEN.</p>
                  <InviteFooterForm />
                </div>
              )}
            </div>

            {/* Categories col 1 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Kategorier</p>
              <ul className="space-y-3">
                {CATEGORIES.slice(0, 4).map(c => (
                  <li key={c.slug}>
                    <Link href={`/kategori/${c.slug}`} className="text-sm text-white/60 hover:text-white transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories col 2 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">&nbsp;</p>
              <ul className="space-y-3">
                {CATEGORIES.slice(4).map(c => (
                  <li key={c.slug}>
                    <Link href={`/kategori/${c.slug}`} className="text-sm text-white/60 hover:text-white transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Info</p>
              <ul className="space-y-3">
                <li><Link href="/sa-funkar-det" className="text-sm text-white/60 hover:text-white transition-colors">Så funkar det</Link></li>
                <li><Link href="/for-talanger" className="text-sm text-white/60 hover:text-white transition-colors">För talanger</Link></li>
                <li><Link href="/signup" className="text-sm text-white/60 hover:text-white transition-colors">Skapa konto</Link></li>
                <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Integritetspolicy</Link></li>
                <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Användarvillkor</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/30">© 2026 FESTEN. Stockholm</p>
            <p className="text-xs text-white/30">Gjord med kärlek för kalas 🎉</p>
          </div>

        </div>
      </footer>

    </div>
  )
}
