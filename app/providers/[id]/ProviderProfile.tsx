'use client'

import { useState, useEffect, type FormEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { track } from '@/lib/posthog'
import { createClient } from '@/lib/supabase'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import Container from '@/components/Container'
import ListingHead from '@/components/listings/ListingHead'
import ListingInfo from '@/components/listings/ListingInfo'
import ListingReservation from '@/components/listings/ListingReservation'
import WishlistSaveModal from '@/components/wishlist/WishlistSaveModal'

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

/**
 * Listing detail — structure from Airbnb clone ListingClient:
 * Container → max-w-screen-lg → Head → grid cols-7 (Info + Reservation)
 * https://github.com/Luancss/next13-airbnb-clone/blob/master/app/listings/[listingId]/ListingClient.tsx
 */
export default function ProviderProfile({
  profile,
  reviews,
  avgRating,
  reviewCount,
  currentUserId,
  isSaved,
}: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(isSaved)
  const [wishlistOpen, setWishlistOpen] = useState(false)
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
    import('@/lib/recently-viewed').then(({ pushRecentlyViewed }) => {
      pushRecentlyViewed({
        id: profile.id,
        title: profile.service_title,
        photo: profile.photos?.[0] ?? null,
      })
    })
  }, [profile.id, profile.service_title, profile.photos])

  function requireLogin(action: 'request' | 'save') {
    setGateAction(action)
    setShowGate(true)
    track('signup_gate_triggered', { trigger: action, provider_id: profile.id })
  }

  async function handleBookingSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentUserId) {
      requireLogin('request')
      return
    }
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
    const providerName = encodeURIComponent(
      profile.users?.name ?? profile.service_title ?? 'Talangen'
    )
    router.push(`/booking/sent?provider=${providerName}`)
  }

  async function handleSave(e?: MouseEvent) {
    e?.stopPropagation()
    e?.preventDefault()
    if (!currentUserId) {
      requireLogin('save')
      return
    }
    if (saved) {
      const { removeFromAllWishlists } = await import('@/lib/wishlists')
      await removeFromAllWishlists(currentUserId, profile.id)
      setSaved(false)
      return
    }
    setWishlistOpen(true)
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
    track('provider_shared', {
      provider_id: profile.id,
      method:
        typeof navigator !== 'undefined' && typeof navigator.share === 'function'
          ? 'native'
          : 'copy',
    })
  }

  const priceLabel =
    profile.price_range_min && profile.price_range_max
      ? `${profile.price_range_min.toLocaleString('sv-SE')} – ${profile.price_range_max.toLocaleString('sv-SE')} kr`
      : profile.price_range_min
        ? `Från ${profile.price_range_min.toLocaleString('sv-SE')} kr`
        : profile.price_range_max
          ? `Upp till ${profile.price_range_max.toLocaleString('sv-SE')} kr`
          : null

  const photos = profile.photos ?? []

  return (
    <main className="min-h-screen bg-white">
      <MarketplaceHeader currentMode="planner" />

      <Container>
        <div className="max-w-screen-lg mx-auto py-6">
          <div className="flex flex-col gap-6">
            <ListingHead
              title={profile.service_title ?? 'Tjänst'}
              photos={photos}
              saved={saved}
              copied={copied}
              onSave={handleSave}
              onShare={handleShare}
              onShowAll={() => setShowAllPhotos(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-7 md:gap-10 mt-8 pt-2">
              <ListingInfo
                hostName={profile.users?.name ?? null}
                hostAvatar={profile.users?.avatar_url ?? null}
                categoryTags={profile.category_tags ?? []}
                description={profile.service_description}
                city={profile.city}
                serviceTitle={profile.service_title}
                reviewCount={reviewCount}
                avgRating={avgRating}
                reviews={reviews}
              />

              <div className="order-first mb-10 md:order-last md:col-span-3">
                <div className="sticky top-24 md:top-28">
                  <ListingReservation
                    priceLabel={priceLabel}
                    reviewCount={reviewCount}
                    avgRating={avgRating}
                    bookingData={bookingData}
                    onChange={setBookingData}
                    onSubmit={handleBookingSubmit}
                    submitting={submitting}
                    error={bookingError}
                    loggedIn={!!currentUserId}
                    onRequireLogin={() => requireLogin('request')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto p-6">
          <button
            type="button"
            onClick={() => setShowAllPhotos(false)}
            className="fixed top-4 left-4 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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

      {showGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowGate(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#222222] mb-2">
              {gateAction === 'request' ? 'Boka den här tjänsten' : 'Spara till lista'}
            </h3>
            <p className="text-sm text-[#6A6A6A] mb-6">
              Logga in för att fortsätta. Det tar bara en sekund.
            </p>
            <a
              href={`/signup?intent=planner&next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : `/providers/${profile.id}`)}`}
              className="block w-full rounded-xl bg-[#FF6B35] px-4 py-3.5 text-center text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
            >
              Logga in eller skapa konto
            </a>
            <button
              type="button"
              onClick={() => setShowGate(false)}
              className="mt-3 w-full text-center text-sm text-[#6A6A6A] hover:text-[#222222]"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {currentUserId && (
        <WishlistSaveModal
          open={wishlistOpen}
          onClose={() => setWishlistOpen(false)}
          providerId={profile.id}
          plannerId={currentUserId}
          onSaved={() => setSaved(true)}
        />
      )}
    </main>
  )
}
