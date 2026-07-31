'use client'

import { useState, useEffect, useRef, type FormEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { track } from '@/lib/posthog'
import { createClient } from '@/lib/supabase'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import Container from '@/components/Container'
import ListingHead from '@/components/listings/ListingHead'
import ListingInfo from '@/components/listings/ListingInfo'
import ListingReservation from '@/components/listings/ListingReservation'
import ListingMeetProvider from '@/components/listings/ListingMeetProvider'
import ListingReviews, { type ListingReview } from '@/components/listings/ListingReviews'
import ListingCard, { type ListingCardData } from '@/components/listings/ListingCard'
import ListingRow from '@/components/listings/ListingRow'
import SiteFooter from '@/components/shared/SiteFooter'
import WizardNavHeader from '@/components/service-wizard/WizardNavHeader'
import WishlistSaveModal from '@/components/wishlist/WishlistSaveModal'
import { useProviderWishlistSaved } from '@/lib/wishlist-saved-state'
import { Button } from '@/components/ui/button'
import { openAuth } from '@/lib/open-auth'
import { shareServiceListing } from '@/lib/service-share'
import {
  needsDisplayName,
  needsPhone,
  welcomeUrl,
} from '@/lib/profile-completeness'
import {
  EMPTY_BOOKING_FORM,
  clearBookingDraft,
  clearBookingDraftPending,
  loadBookingDraft,
  saveBookingDraft,
  type BookingFormData,
} from '@/lib/booking-draft'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Profile = {
  id: string
  user_id: string
  title: string | null
  description: string | null
  category_slug: string | null
  category_tags: string[]
  occasions: string[]
  city: string | null
  price_range_min: number | null
  price_range_max: number | null
  photos: string[]
  users: { name: string | null; avatar_url: string | null } | null
  bio: string | null
  memberSince: string | null
}

type PreviewMode = 'live' | 'draft' | 'paused'

type Props = {
  profile: Profile
  reviews: ListingReview[]
  avgRating: number | null
  reviewCount: number
  currentUserId: string | null
  isSaved: boolean
  similarServices: ListingCardData[]
  /** Owner-only non-live views of the public page */
  previewMode?: PreviewMode
  /** Safe path back to wizard / listings when previewing */
  previewReturnPath?: string | null
}

/**
 * Listing detail — sticky booking only beside description (Airbnb pattern).
 * Meet provider → Reviews (full width) → Similar → Footer sit below the sticky column.
 */
export default function ServiceProfile({
  profile,
  reviews,
  avgRating,
  reviewCount,
  currentUserId,
  isSaved,
  similarServices,
  previewMode = 'live',
  previewReturnPath = null,
}: Props) {
  const isPreview = previewMode !== 'live'
  const fromWizard = !!previewReturnPath?.includes('/flow')
  const backHref = previewReturnPath ?? '/dashboard/listings'
  const backLabel = fromWizard ? 'Tillbaka till publicering' : 'Tillbaka till tjänster'
  const wizardExitHref = previewReturnPath?.startsWith('/onboarding')
    ? '/dashboard'
    : '/dashboard/listings'
  const router = useRouter()
  const { saved, markSaved, markUnsaved } = useProviderWishlistSaved(
    profile.id,
    isSaved
  )
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [bookingData, setBookingData] = useState<BookingFormData>(EMPTY_BOOKING_FORM)
  const [draftReady, setDraftReady] = useState(false)
  const [phoneGateOpen, setPhoneGateOpen] = useState(false)
  const [phoneValue, setPhoneValue] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const autoSubmitRef = useRef(false)
  const pendingBookingRef = useRef<{ plannerId: string; data: BookingFormData } | null>(null)

  useEffect(() => {
    track('profile_viewed', { provider_id: profile.id, source: 'direct' })
    import('@/lib/recently-viewed').then(({ pushRecentlyViewed }) => {
      pushRecentlyViewed({
        id: profile.id,
        title: profile.title,
        photo: profile.photos?.[0] ?? null,
      })
    })
  }, [profile.id, profile.title, profile.photos])

  // Restore draft after auth redirect (sessionStorage survives full page reload).
  useEffect(() => {
    const draft = loadBookingDraft(profile.id)
    if (draft) setBookingData(draft.data)
    setDraftReady(true)
  }, [profile.id])

  // Keep draft in sync while typing so OAuth round-trips don't lose fields.
  useEffect(() => {
    if (!draftReady) return
    saveBookingDraft(profile.id, bookingData)
  }, [bookingData, profile.id, draftReady])

  useEffect(() => {
    if (!currentUserId) return
    import('@/lib/wishlists').then(({ prefetchUserWishlists }) => {
      prefetchUserWishlists(currentUserId)
    })
  }, [currentUserId])

  // After login / welcome, if they had just clicked “Skicka förfrågan”, finish the submit.
  useEffect(() => {
    if (!draftReady || !currentUserId || autoSubmitRef.current) return
    const draft = loadBookingDraft(profile.id)
    if (!draft?.pendingSubmit) return
    const age = Date.now() - (draft.savedAt ?? 0)
    if (age > 1000 * 60 * 15) {
      clearBookingDraftPending(profile.id)
      return
    }
    autoSubmitRef.current = true
    clearBookingDraftPending(profile.id)
    void prepareAndSubmitBooking(currentUserId, draft.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once after auth restore
  }, [draftReady, currentUserId, profile.id])

  function requireLogin(trigger: 'request' | 'save') {
    track('signup_gate_triggered', { trigger, provider_id: profile.id })
    saveBookingDraft(profile.id, bookingData, {
      pendingSubmit: trigger === 'request',
    })
    openAuth({ intent: 'planner', next: `/tjanster/${profile.id}` })
  }

  async function prepareAndSubmitBooking(plannerId: string, data: BookingFormData) {
    setSubmitting(true)
    setBookingError(null)
    const supabase = createClient()
    const { data: row } = await supabase
      .from('users')
      .select('name, first_name, phone')
      .eq('id', plannerId)
      .maybeSingle()

    if (needsDisplayName(row)) {
      saveBookingDraft(profile.id, data, { pendingSubmit: true })
      setSubmitting(false)
      autoSubmitRef.current = false
      router.push(welcomeUrl(`/tjanster/${profile.id}`))
      return
    }

    if (needsPhone(row)) {
      pendingBookingRef.current = { plannerId, data }
      setPhoneValue('')
      setPhoneError(null)
      setPhoneGateOpen(true)
      setSubmitting(false)
      return
    }

    await submitBooking(plannerId, data)
  }

  async function submitBooking(plannerId: string, data: BookingFormData) {
    if (plannerId === profile.user_id) {
      setBookingError('Du kan inte skicka en förfrågan till dig själv.')
      setSubmitting(false)
      return
    }
    setSubmitting(true)
    setBookingError(null)
    const supabase = createClient()
    const { error } = await supabase.from('booking_requests').insert({
      planner_id: plannerId,
      service_id: profile.id,
      event_date: data.event_date || null,
      occasions: data.occasions,
      event_type: data.occasions[0] ?? null,
      event_location: data.event_location || null,
      event_place_id: data.event_place_id || null,
      event_lat: data.event_lat,
      event_lng: data.event_lng,
      guest_count: data.guest_count ? Number(data.guest_count) : null,
      description: data.description || null,
      status: 'pending',
    })
    if (error) {
      setBookingError('Något gick fel. Försök igen.')
      setSubmitting(false)
      autoSubmitRef.current = false
      return
    }
    clearBookingDraft()
    track('booking_request_sent', {
      provider_id: profile.id,
      occasions: data.occasions,
      event_type: data.occasions[0] ?? null,
      event_date: data.event_date,
      guest_count: data.guest_count,
    })
    setSubmitting(false)
    const providerName = encodeURIComponent(
      profile.users?.name ?? profile.title ?? 'Talangen'
    )
    router.push(`/booking/sent?provider=${providerName}`)
  }

  async function handlePhoneGateSave() {
    const phone = phoneValue.trim()
    if (!phone) {
      setPhoneError('Ange ett telefonnummer så talangen kan nå dig.')
      return
    }
    const pending = pendingBookingRef.current
    if (!pending) {
      setPhoneGateOpen(false)
      return
    }

    setPhoneSaving(true)
    setPhoneError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ phone })
      .eq('id', pending.plannerId)

    if (error) {
      setPhoneError('Kunde inte spara. Försök igen.')
      setPhoneSaving(false)
      return
    }

    track('profile_details_completed', { fields: ['phone'] })
    setPhoneGateOpen(false)
    setPhoneSaving(false)
    pendingBookingRef.current = null
    await submitBooking(pending.plannerId, pending.data)
  }

  async function handleBookingSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentUserId) {
      requireLogin('request')
      return
    }
    if (bookingData.occasions.length < 1) {
      const listingOccasions = (profile.occasions ?? []).filter(Boolean)
      if (listingOccasions.length > 0) {
        setBookingError('Välj minst ett tillfälle.')
        return
      }
    }
    await prepareAndSubmitBooking(currentUserId, bookingData)
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
      markUnsaved()
      return
    }
    const { fetchUserWishlists, getCachedWishlists } = await import('@/lib/wishlists')
    if (!getCachedWishlists(currentUserId)) {
      try {
        await fetchUserWishlists(currentUserId)
      } catch {
        // Modal will handle loading if prefetch failed.
      }
    }
    setWishlistOpen(true)
  }

  async function handleShare() {
    try {
      const result = await shareServiceListing({
        id: profile.id,
        title: profile.title,
        city: profile.city,
        category_slug: profile.category_slug,
        category_tags: profile.category_tags,
        origin: window.location.origin,
      })
      if (!result.shared) return
      track('provider_shared', {
        provider_id: profile.id,
        method: result.method,
        source: 'service_profile',
      })
      if (result.method === 'copy') {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // ignore share failures
    }
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
      {fromWizard ? (
        <WizardNavHeader exitHref={wizardExitHref} exitLabel="Avsluta" />
      ) : (
        <MarketplaceHeader currentMode="planner" />
      )}

      {isPreview ? (
        <div className="border-b border-[#ebebeb] bg-[#f7f7f7]">
          <div className="mx-auto flex max-w-screen-lg flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] font-medium text-[#222222]">
              {previewMode === 'paused'
                ? 'Förhandsgranskning — pausad. Syns inte i sök eller på startsidan.'
                : 'Förhandsgranskning — utkast. Syns inte för planerare ännu.'}
            </p>
            <Link
              href={backHref}
              className="text-[14px] font-semibold text-[#222222] underline underline-offset-2"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      ) : null}

      <Container>
        <div className="max-w-screen-lg mx-auto py-6">
          <div className="flex flex-col gap-6">
            <ListingHead
              title={profile.title ?? 'Tjänst'}
              photos={photos}
              saved={saved}
              copied={copied}
              onSave={isPreview ? () => undefined : handleSave}
              onShare={handleShare}
              onShowAll={() => setShowAllPhotos(true)}
              hideSave={isPreview}
              hideShare={fromWizard}
            />

            {/* Sticky booking only spans this grid — stops before Meet / Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-7 md:gap-10 mt-8 pt-2">
              <ListingInfo
                hostName={profile.users?.name ?? null}
                hostAvatar={profile.users?.avatar_url ?? null}
                occasions={profile.occasions}
                description={profile.description}
                city={profile.city}
                serviceTitle={profile.title}
                reviewCount={reviewCount}
                avgRating={avgRating}
              />

              <div id="forfragan" className="order-first mb-10 md:order-last md:col-span-3 scroll-mt-28">
                <div className="sticky top-24 md:top-28">
                  {isPreview ? (
                    <div className="rounded-2xl border border-[#dddddd] bg-[#f7f7f7] p-6">
                      <p className="text-[16px] font-semibold text-[#222222]">
                        Bokning är avstängd i förhandsgranskning
                      </p>
                      <p className="mt-2 text-[14px] leading-relaxed text-[#6a6a6a]">
                        Så här ser sidan ut för planerare. Publicera (och aktivera) tjänsten för att
                        ta emot förfrågningar.
                      </p>
                      <Button asChild variant="dark" className="mt-4 rounded-xl">
                        <Link href={backHref}>{backLabel}</Link>
                      </Button>
                    </div>
                  ) : (
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
                      serviceOccasions={profile.occasions}
                    />
                  )}
                </div>
              </div>
            </div>

            <ListingMeetProvider
              hostName={profile.users?.name ?? null}
              hostAvatar={profile.users?.avatar_url ?? null}
              bio={profile.bio}
              city={profile.city}
              memberSince={profile.memberSince}
              reviewCount={reviewCount}
              avgRating={avgRating}
            />

            <ListingReviews
              reviews={reviews}
              avgRating={avgRating}
              reviewCount={reviewCount}
            />
          </div>
        </div>
      </Container>

      {similarServices.length > 0 && !fromWizard ? (
        <div className="border-t border-[#ebebeb] pt-10 pb-4 mt-2">
          <ListingRow title="Fler tjänster i närheten">
            {similarServices.map(s => (
              <ListingCard
                key={s.id}
                data={s}
                isLoggedIn={!!currentUserId}
                plannerId={currentUserId}
                variant="explore"
              />
            ))}
          </ListingRow>
        </div>
      ) : null}

      {!fromWizard ? <SiteFooter isLoggedIn={!!currentUserId} /> : null}

      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto p-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowAllPhotos(false)}
            className="fixed top-4 left-4 bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
          </Button>
          <div className="max-w-3xl mx-auto pt-12 space-y-4">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image src={photo} alt="" fill className="object-cover" sizes="768px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {currentUserId && (
        <WishlistSaveModal
          open={wishlistOpen}
          onClose={() => setWishlistOpen(false)}
          onOpen={() => setWishlistOpen(true)}
          providerId={profile.id}
          plannerId={currentUserId}
          providerPhoto={photos[0] ?? null}
          onSaved={markSaved}
        />
      )}

      <Dialog
        open={phoneGateOpen}
        onOpenChange={open => {
          setPhoneGateOpen(open)
          if (!open) {
            pendingBookingRef.current = null
            autoSubmitRef.current = false
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl" showClose>
          <DialogHeader>
            <DialogTitle>Nästan klart</DialogTitle>
            <DialogDescription>
              Lägg till ett telefonnummer så talangen kan nå dig om din förfrågan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="booking-phone">Telefonnummer</Label>
            <Input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phoneValue}
              onChange={e => setPhoneValue(e.target.value)}
              placeholder="+46 70 123 45 67"
              className="h-12 rounded-xl text-[16px]"
              disabled={phoneSaving}
              autoFocus
            />
            {phoneError && (
              <p className="text-sm text-destructive" role="alert">
                {phoneError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={phoneSaving}
              onClick={() => {
                setPhoneGateOpen(false)
                pendingBookingRef.current = null
                autoSubmitRef.current = false
              }}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={phoneSaving}
              onClick={() => void handlePhoneGateSave()}
            >
              {phoneSaving ? 'Sparar…' : 'Skicka förfrågan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
