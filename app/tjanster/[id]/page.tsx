import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ServiceProfile from './ServiceProfile'
import type { Metadata } from 'next'
import type { ListingCardData } from '@/components/listings/ListingCard'
import { formatCategoryFromSlug, resolveCategorySlug } from '@/lib/categories'
import { formatEventType } from '@/lib/event-types'
import { normalizeOccasions } from '@/lib/occasions'
import { HOST_USERS_SELECT, hostDisplayName, hostUserForDisplay } from '@/lib/host-display-name'
import { getHostReviewStats } from '@/lib/host-reviews'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: service } = await supabase
    .from('services')
    .select(
      `title, description, photos, city, provider_profiles(users(${HOST_USERS_SELECT}))`
    )
    .eq('id', params.id)
    .single()

  if (!service) return {}

  const provider = Array.isArray(service.provider_profiles)
    ? service.provider_profiles[0]
    : service.provider_profiles
  const usersArr = provider?.users as unknown
  const user = Array.isArray(usersArr) ? usersArr[0] ?? null : usersArr
  const hostName = hostDisplayName(user ?? {})
  const title = service.title ?? (hostName || 'Talang')
  const description =
    service.description?.slice(0, 160) ??
    `Boka ${title} i ${service.city ?? 'Stockholm'} via Festly`
  const image = service.photos?.[0]
  const ogTitle = `${title} | Festly`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      locale: 'sv_SE',
      siteName: 'Festly',
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: title }]
        : [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Festly' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: image ? [image] : ['/og-default.png'],
    },
  }
}

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { return?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const returnRaw = searchParams?.return ?? null
  const returnPath =
    returnRaw &&
    returnRaw.startsWith('/') &&
    !returnRaw.startsWith('//') &&
    (returnRaw.startsWith('/onboarding/flow') ||
      returnRaw.startsWith('/dashboard/listings/new/flow') ||
      returnRaw === '/dashboard/listings')
      ? returnRaw
      : null

  const { data: service } = await supabase
    .from('services')
    .select(
      `*, provider_profiles(id, user_id, bio, city, location_id, created_at, users(${HOST_USERS_SELECT}))`
    )
    .eq('id', params.id)
    .single()

  if (!service) notFound()

  const provider = Array.isArray(service.provider_profiles)
    ? service.provider_profiles[0]
    : service.provider_profiles

  const isLive = service.is_published === true && service.is_disabled !== true
  const isOwner = !!user && !!provider?.user_id && user.id === provider.user_id

  if (!isLive && !isOwner) notFound()

  const previewMode: 'live' | 'draft' | 'paused' = isLive
    ? 'live'
    : service.is_disabled
      ? 'paused'
      : 'draft'

  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      `rating, comment, created_at,
       users!reviewer_id(name, avatar_url, address_city, address_country, privacy_review_show_city, privacy_review_show_booked_services),
       booking_requests!booking_request_id(event_type, services!service_id(title, category_slug, category_tags))`
    )
    .eq('service_id', service.id)
    .order('created_at', { ascending: false })

  const hostUser = provider
    ? Array.isArray(provider.users)
      ? (provider.users[0] ?? null)
      : provider.users
    : null

  const categorySlug = resolveCategorySlug({
    category_slug: service.category_slug,
    category_tags: service.category_tags,
  })

  const normalizedProfile = {
    id: service.id,
    user_id: provider?.user_id ?? '',
    title: service.title,
    description: service.description,
    category_slug: categorySlug,
    category_tags: service.category_tags ?? [],
    occasions: normalizeOccasions(service.occasions),
    city: service.city,
    hostBasedIn: provider?.city ?? service.city ?? null,
    can_travel: !!service.can_travel,
    price_range_min: service.price_range_min,
    price_range_max: service.price_range_max,
    photos: service.photos ?? [],
    users: hostUserForDisplay(hostUser),
    bio: provider?.bio ?? null,
    memberSince: provider?.created_at ?? null,
  }

  const normalizedReviews = (reviews ?? []).map(r => {
    const reviewer = Array.isArray(r.users) ? (r.users[0] ?? null) : r.users
    const booking = Array.isArray(r.booking_requests)
      ? (r.booking_requests[0] ?? null)
      : r.booking_requests
    const bookingService = booking?.services
      ? Array.isArray(booking.services)
        ? booking.services[0]
        : booking.services
      : null

    const showCity = reviewer?.privacy_review_show_city ?? true
    const showServices = reviewer?.privacy_review_show_booked_services ?? false

    const locationLabel =
      showCity && reviewer?.address_city
        ? [reviewer.address_city, reviewer.address_country].filter(Boolean).join(', ')
        : null

    let serviceLabel: string | null = null
    if (showServices) {
      const title = bookingService?.title
      const eventLabel = formatEventType(booking?.event_type)
      const catLabel = formatCategoryFromSlug(
        resolveCategorySlug({
          category_slug: bookingService?.category_slug,
          category_tags: bookingService?.category_tags,
        })
      )
      serviceLabel = [title ?? catLabel, eventLabel].filter(Boolean).join(' · ') || null
    }

    return {
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      users: reviewer
        ? { name: reviewer.name, avatar_url: reviewer.avatar_url }
        : null,
      locationLabel,
      serviceLabel,
    }
  })

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  const hostReviewStats = provider?.user_id
    ? await getHostReviewStats(supabase, provider.user_id)
    : { avgRating: null, reviewCount: 0 }

  let isSaved = false
  if (user) {
    const { data: lists } = await supabase
      .from('shortlists')
      .select('id')
      .eq('planner_id', user.id)

    if (lists?.length) {
      const { data: item } = await supabase
        .from('shortlist_items')
        .select('id')
        .eq('service_id', params.id)
        .in(
          'shortlist_id',
          lists.map(l => l.id)
        )
        .limit(1)
        .maybeSingle()
      isSaved = !!item
    }
  }

  // Similar: same city first, then same category — exclude current.
  let similarQuery = supabase
    .from('services')
    .select(
      `id, title, city, photos, category_slug, category_tags, price_range_min, provider_profiles(users(${HOST_USERS_SELECT}))`
    )
    .eq('is_published', true)
    .eq('is_disabled', false)
    .neq('id', service.id)
    .limit(14)

  if (service.city) {
    similarQuery = similarQuery.eq('city', service.city)
  }

  const { data: similarRaw } = await similarQuery

  let similarRows = similarRaw ?? []

  // If same-city pool is thin, fill with same category (any city).
  if (similarRows.length < 8 && categorySlug) {
    const { data: byCat } = await supabase
      .from('services')
      .select(
        `id, title, city, photos, category_slug, category_tags, price_range_min, provider_profiles(users(${HOST_USERS_SELECT}))`
      )
      .eq('is_published', true)
    .eq('is_disabled', false)
      .neq('id', service.id)
      .eq('category_slug', categorySlug)
      .limit(14)

    const seen = new Set(similarRows.map(s => s.id))
    for (const row of byCat ?? []) {
      if (!seen.has(row.id)) {
        similarRows.push(row)
        seen.add(row.id)
      }
      if (similarRows.length >= 14) break
    }
  }

  const similarIds = similarRows.map(s => s.id)
  const ratingByService = new Map<string, { sum: number; count: number }>()

  if (similarIds.length > 0) {
    const { data: similarReviews } = await supabase
      .from('reviews')
      .select('service_id, rating')
      .in('service_id', similarIds)

    for (const r of similarReviews ?? []) {
      const cur = ratingByService.get(r.service_id) ?? { sum: 0, count: 0 }
      cur.sum += r.rating
      cur.count += 1
      ratingByService.set(r.service_id, cur)
    }
  }

  const similarServices: ListingCardData[] = similarRows.slice(0, 12).map(s => {
    const pp = Array.isArray(s.provider_profiles)
      ? s.provider_profiles[0]
      : s.provider_profiles
    const u = pp?.users
      ? Array.isArray(pp.users)
        ? pp.users[0]
        : pp.users
      : null
    const stats = ratingByService.get(s.id)
    return {
      id: s.id,
      title: s.title,
      city: s.city,
      photos: s.photos ?? [],
      category_slug: s.category_slug ?? null,
      category_tags: s.category_tags ?? [],
      price_range_min: s.price_range_min,
      users: hostUserForDisplay(u),
      reviewCount: stats?.count ?? 0,
      avgRating: stats && stats.count > 0 ? stats.sum / stats.count : null,
    }
  })

  return (
    <ServiceProfile
      profile={normalizedProfile}
      reviews={normalizedReviews}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
      hostAvgRating={hostReviewStats.avgRating}
      hostReviewCount={hostReviewStats.reviewCount}
      currentUserId={user?.id ?? null}
      isSaved={isSaved}
      similarServices={previewMode === 'live' ? similarServices : []}
      previewMode={previewMode}
      previewReturnPath={returnPath}
    />
  )
}
