'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { track } from '@/lib/posthog'
import { createClient } from '@/lib/supabase'

type Review = {
  rating: number
  comment: string | null
  created_at: string
  users: { name: string | null; avatar_url: string | null } | null
}

type Profile = {
  id: string
  user_id: string
  service_title: string | null
  service_description: string | null
  category_tags: string[]
  city: string | null
  price_range_min: number | null
  price_range_max: number | null
  photos: string[]
  users: { name: string | null; avatar_url: string | null } | null
}

type Props = {
  profile: Profile
  reviews: Review[]
  avgRating: number | null
  reviewCount: number
  currentUserId: string | null
  isSaved: boolean
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#FF6B35' : 'none'} stroke="#FF6B35" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
        </svg>
      ))}
    </span>
  )
}

export default function ProviderProfile({ profile, reviews, avgRating, reviewCount, currentUserId, isSaved }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(isSaved)
  const [showGate, setShowGate] = useState(false)
  const [gateAction, setGateAction] = useState<'request' | 'save'>('request')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [bookingData, setBookingData] = useState({
    event_date: '',
    event_type: '',
    event_location: '',
    guest_count: '',
    description: '',
  })

  useEffect(() => {
    track('profile_viewed', { provider_id: profile.id, source: 'direct' })
  }, [profile.id])

  function handleRequestClick() {
    if (!currentUserId) {
      setGateAction('request')
      setShowGate(true)
      track('signup_gate_triggered', { trigger: 'request', provider_id: profile.id })
    }
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId) { handleRequestClick(); return }
    setSubmitting(true)
    setBookingError(null)
    const supabase = createClient()
    const { error } = await supabase.from('booking_requests').insert({
      planner_id: currentUserId,
      provider_profile_id: profile.id,
      event_date: bookingData.event_date || null,
      event_type: bookingData.event_type || null,
      event_location: bookingData.event_location || null,
      guest_count: bookingData.guest_count ? Number(bookingData.guest_count) : null,
      description: bookingData.description || null,
      status: 'pending',
    })
    if (error) {
      setBookingError('Något gick fel. Försök igen.')
      setSubmitting(false)
      return
    }
    track('booking_request_sent', {
      provider_id: profile.id,
      event_type: bookingData.event_type,
      event_date: bookingData.event_date,
      guest_count: bookingData.guest_count,
    })
    setSubmitting(false)
    const providerName = encodeURIComponent(profile.users?.name ?? profile.service_title ?? 'Talangen')
    router.push(`/booking/sent?provider=${providerName}`)
  }

  async function handleSave() {
    if (!currentUserId) {
      setGateAction('save')
      setShowGate(true)
      track('signup_gate_triggered', { trigger: 'save', provider_id: profile.id })
      return
    }
    setSaved(true)
    const supabase = createClient()
    let { data: shortlist } = await supabase.from('shortlists').select('id').eq('planner_id', currentUserId).single()
    if (!shortlist) {
      const { data } = await supabase.from('shortlists').insert({ planner_id: currentUserId }).select('id').single()
      shortlist = data
    }
    if (shortlist) {
      await supabase.from('shortlist_items').upsert({ shortlist_id: shortlist.id, provider_profile_id: profile.id })
      track('shortlist_item_saved', { provider_id: profile.id, planner_id: currentUserId })
    }
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: profile.service_title ?? 'FESTEN.', url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    track('provider_shared', { provider_id: profile.id, method: navigator.share ? 'native' : 'copy' })
  }

  const priceLabel = profile.price_range_min && profile.price_range_max
    ? `${profile.price_range_min.toLocaleString('sv-SE')} – ${profile.price_range_max.toLocaleString('sv-SE')} kr`
    : profile.price_range_min
    ? `Från ${profile.price_range_min.toLocaleString('sv-SE')} kr`
    : profile.price_range_max
    ? `Upp till ${profile.price_range_max.toLocaleString('sv-SE')} kr`
    : null

  const photos = profile.photos ?? []

  return (
    <main className="min-h-screen bg-white">

      {/* ── TOP NAV ── */}
      <div className="border-b border-[#EBEBEB] px-6 lg:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-[#FF6B35]">FESTEN.</Link>
        <div className="flex items-center gap-3">
          <button onClick={handleShare} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#1A1A2E] hover:bg-[#F7F7F7] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            {copied ? 'Kopierad!' : 'Dela'}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${saved ? 'text-[#FF6B35] bg-[#FF6B35]/10' : 'text-[#1A1A2E] hover:bg-[#F7F7F7]'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? '#FF6B35' : 'none'} stroke={saved ? '#FF6B35' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {saved ? 'Sparad' : 'Spara'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-6 lg:px-10 py-8">

        {/* ── TITLE ── */}
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-1">{profile.service_title ?? 'Tjänst'}</h1>
        <div className="flex items-center gap-3 text-sm text-[#717171] mb-6 flex-wrap">
          {reviewCount > 0 && (
            <span className="flex items-center gap-1 text-[#1A1A2E] font-medium">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#1A1A2E"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
              {avgRating!.toFixed(1)}
              <span className="font-normal text-[#717171] underline ml-0.5">{reviewCount} recensioner</span>
            </span>
          )}
          {reviewCount === 0 && <span>Ny på plattformen</span>}
          {profile.city && <span>📍 {profile.city}</span>}
          {profile.users?.name && <span>av {profile.users.name}</span>}
        </div>

        {/* ── PHOTO GALLERY ── */}
        {photos.length > 0 && (
          <div className="relative mb-10 rounded-2xl overflow-hidden">
            {photos.length === 1 ? (
              <div className="relative aspect-[16/7] w-full bg-[#F0EDE8]">
                <Image src={photos[0]} alt={profile.service_title ?? ''} fill className="object-cover" priority sizes="1120px" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* Main large photo */}
                <div className="relative aspect-[4/3] bg-[#F0EDE8]">
                  <Image src={photos[0]} alt={profile.service_title ?? ''} fill className="object-cover" priority sizes="560px" />
                </div>
                {/* Right grid — up to 4 small photos */}
                <div className="grid grid-cols-2 gap-2">
                  {photos.slice(1, 5).map((photo, i) => (
                    <div key={i} className="relative aspect-square bg-[#F0EDE8]">
                      <Image src={photo} alt="" fill className="object-cover" sizes="280px" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {photos.length > 5 && (
              <button
                onClick={() => setShowAllPhotos(true)}
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-[#1A1A2E] bg-white px-4 py-2 text-sm font-semibold text-[#1A1A2E] hover:bg-[#F7F7F7] transition-colors shadow"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Visa alla {photos.length} foton
              </button>
            )}
          </div>
        )}

        {/* ── TWO COLUMNS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-14">

          {/* LEFT — Content */}
          <div className="lg:col-span-4">

            {/* Provider info */}
            <div className="flex items-center gap-4 pb-6 border-b border-[#EBEBEB] mb-6">
              {profile.users?.avatar_url ? (
                <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={profile.users.avatar_url} alt="" fill className="object-cover" sizes="56px" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-[#FF6B35]">
                  {(profile.users?.name ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-[#1A1A2E]">{profile.users?.name ?? 'Okänd'}</p>
                <p className="text-sm text-[#717171]">Erbjuder tjänster via FESTEN.</p>
              </div>
            </div>

            {/* Tags */}
            {profile.category_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.category_tags.map(tag => (
                  <span key={tag} className="rounded-full border border-[#EBEBEB] px-3 py-1 text-sm text-[#717171]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {profile.service_description && (
              <div className="pb-8 border-b border-[#EBEBEB] mb-8">
                <h2 className="text-xl font-semibold text-[#1A1A2E] mb-3">Om tjänsten</h2>
                <p className="text-[#717171] leading-relaxed">{profile.service_description}</p>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1A2E"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                  <h2 className="text-xl font-semibold text-[#1A1A2E]">
                    {avgRating!.toFixed(1)} · {reviewCount} {reviewCount === 1 ? 'recension' : 'recensioner'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {reviews.map((review, i) => (
                    <div key={i} className="space-y-2">
                      <StarRating rating={review.rating} />
                      {review.comment && (
                        <p className="text-sm text-[#1A1A2E] leading-relaxed">{review.comment}</p>
                      )}
                      <p className="text-sm font-semibold text-[#1A1A2E]">{review.users?.name ?? 'Anonym'}</p>
                      <p className="text-xs text-[#717171]">
                        {new Date(review.created_at).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Sticky booking panel */}
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <div className="rounded-2xl border border-[#EBEBEB] shadow-lg p-6">

                {/* Price */}
                <div className="mb-5">
                  {priceLabel ? (
                    <p className="text-xl font-semibold text-[#1A1A2E]">
                      {priceLabel}
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-[#1A1A2E]">Kontakta för pris</p>
                  )}
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-[#717171]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#717171"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                      {avgRating!.toFixed(1)} · {reviewCount} recensioner
                    </div>
                  )}
                </div>

                {/* Booking form */}
                <form onSubmit={handleBookingSubmit} className="space-y-3">
                  <div className="rounded-xl border border-[#DDDDDD] overflow-hidden divide-y divide-[#DDDDDD]">
                    <div className="px-3 py-2.5">
                      <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-1">Datum</label>
                      <input
                        type="date"
                        value={bookingData.event_date}
                        onChange={e => setBookingData(p => ({ ...p, event_date: e.target.value }))}
                        className="w-full text-sm text-[#1A1A2E] focus:outline-none bg-transparent"
                      />
                    </div>
                    <div className="px-3 py-2.5">
                      <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-1">Typ av event</label>
                      <select
                        value={bookingData.event_type}
                        onChange={e => setBookingData(p => ({ ...p, event_type: e.target.value }))}
                        className="w-full text-sm text-[#1A1A2E] focus:outline-none bg-transparent"
                      >
                        <option value="">Välj typ...</option>
                        <option value="birthday">Födelsedag</option>
                        <option value="wedding">Bröllop</option>
                        <option value="corporate">Företagsevent</option>
                        <option value="kids">Barnkalas</option>
                        <option value="other">Annat</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[#DDDDDD]">
                      <div className="px-3 py-2.5">
                        <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-1">Plats</label>
                        <input
                          type="text"
                          value={bookingData.event_location}
                          onChange={e => setBookingData(p => ({ ...p, event_location: e.target.value }))}
                          placeholder="Stockholm"
                          className="w-full text-sm text-[#1A1A2E] placeholder-[#B0B0B0] focus:outline-none bg-transparent"
                        />
                      </div>
                      <div className="px-3 py-2.5">
                        <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-1">Gäster</label>
                        <input
                          type="number"
                          min="1"
                          value={bookingData.guest_count}
                          onChange={e => setBookingData(p => ({ ...p, guest_count: e.target.value }))}
                          placeholder="30"
                          className="w-full text-sm text-[#1A1A2E] placeholder-[#B0B0B0] focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-1">Meddelande</label>
                      <textarea
                        value={bookingData.description}
                        onChange={e => setBookingData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Berätta om ditt event..."
                        rows={2}
                        className="w-full text-sm text-[#1A1A2E] placeholder-[#B0B0B0] focus:outline-none bg-transparent resize-none"
                      />
                    </div>
                  </div>

                  {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={!currentUserId ? handleRequestClick : undefined}
                    className="w-full rounded-xl bg-[#FF6B35] py-4 text-base font-semibold text-white hover:bg-[#e55a26] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Skickar...' : 'Skicka förfrågan'}
                  </button>

                  <p className="text-center text-xs text-[#717171]">Du debiteras ingenting ännu</p>
                </form>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── ALL PHOTOS MODAL ── */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto p-6">
          <button
            onClick={() => setShowAllPhotos(false)}
            className="fixed top-4 left-4 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="max-w-3xl mx-auto pt-12 space-y-4">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image src={photo} alt="" fill className="object-cover" sizes="768px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GATE MODAL ── */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowGate(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
              {gateAction === 'request' ? 'Boka den här tjänsten' : 'Spara till lista'}
            </h3>
            <p className="text-sm text-[#717171] mb-6">Logga in för att fortsätta. Det tar bara en sekund.</p>
            <a
              href={`/signup?next=${encodeURIComponent(window.location.pathname)}`}
              className="block w-full rounded-xl bg-[#FF6B35] px-4 py-3.5 text-center text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
            >
              Logga in eller skapa konto
            </a>
            <button onClick={() => setShowGate(false)} className="mt-3 w-full text-center text-sm text-[#717171] hover:text-[#1A1A2E]">
              Avbryt
            </button>
          </div>
        </div>
      )}

    </main>
  )
}
