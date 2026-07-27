import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import ShortlistView from '../ShortlistView'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shortlists')
    .select('name')
    .eq('id', params.id)
    .maybeSingle()
  return { title: data?.name || 'Önskelista' }
}

export default async function WishlistDetailPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/signup?next=/planner/shortlist/${params.id}`)

  const { data: shortlist } = await supabase
    .from('shortlists')
    .select('id, name, share_token, planner_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!shortlist || shortlist.planner_id !== user.id) notFound()

  const { data: items } = await supabase
    .from('shortlist_items')
    .select(
      `id, note, service_id,
       services(
         id, title, city, photos, category_tags,
         price_range_min, price_range_max,
         provider_profiles(users(name)),
         reviews(rating)
       )`
    )
    .eq('shortlist_id', shortlist.id)
    .order('added_at', { ascending: false })

  const normalized = (items ?? []).map(item => {
    const raw = item.services
    const service = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      title: string | null
      city: string | null
      photos: string[]
      category_tags: string[]
      price_range_min: number | null
      price_range_max: number | null
      provider_profiles:
        | { users: { name: string | null } | { name: string | null }[] | null }
        | { users: { name: string | null } | { name: string | null }[] | null }[]
        | null
      reviews: { rating: number }[] | null
    } | null

    const provider = service?.provider_profiles
      ? Array.isArray(service.provider_profiles)
        ? service.provider_profiles[0]
        : service.provider_profiles
      : null

    let users: { name: string | null } | null = null
    if (provider?.users) {
      users = Array.isArray(provider.users) ? provider.users[0] ?? null : provider.users
    }

    const reviews = service?.reviews ?? []
    const reviewCount = reviews.length
    const avgRating =
      reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null

    return {
      id: item.id,
      service_id: item.service_id,
      note: (item as { note?: string | null }).note ?? null,
      services: service
        ? {
            id: service.id,
            title: service.title,
            city: service.city,
            photos: service.photos ?? [],
            category_tags: service.category_tags ?? [],
            price_range_min: service.price_range_min,
            price_range_max: service.price_range_max,
            users,
            avgRating,
            reviewCount,
          }
        : null,
    }
  })

  return (
    <ShortlistView
      shortlistId={shortlist.id}
      shareToken={shortlist.share_token}
      name={shortlist.name || 'Favoriter'}
      plannerId={user.id}
      items={normalized}
    />
  )
}
