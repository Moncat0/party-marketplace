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
      `id, note, provider_profile_id,
       provider_profiles(
         id, service_title, city, photos, category_tags,
         price_range_min, price_range_max, user_id,
         users(name)
       )`
    )
    .eq('shortlist_id', shortlist.id)
    .order('added_at', { ascending: false })

  const userIds = (items ?? [])
    .map(item => {
      const raw = item.provider_profiles
      const profile = (Array.isArray(raw) ? raw[0] : raw) as { user_id?: string } | null
      return profile?.user_id
    })
    .filter((id): id is string => !!id)

  const reviewMap: Record<string, { count: number; total: number }> = {}
  if (userIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('reviewee_id, rating')
      .in('reviewee_id', userIds)
    for (const r of reviews ?? []) {
      if (!reviewMap[r.reviewee_id]) reviewMap[r.reviewee_id] = { count: 0, total: 0 }
      reviewMap[r.reviewee_id].count++
      reviewMap[r.reviewee_id].total += r.rating
    }
  }

  const normalized = (items ?? []).map(item => {
    const raw = item.provider_profiles
    const profile = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      service_title: string | null
      city: string | null
      photos: string[]
      category_tags: string[]
      price_range_min: number | null
      price_range_max: number | null
      user_id: string
      users: { name: string | null } | { name: string | null }[] | null
    } | null

    let users: { name: string | null } | null = null
    if (profile?.users) {
      users = Array.isArray(profile.users) ? profile.users[0] ?? null : profile.users
    }

    const stats = profile ? reviewMap[profile.user_id] : null

    return {
      id: item.id,
      provider_profile_id: item.provider_profile_id,
      note: (item as { note?: string | null }).note ?? null,
      provider_profiles: profile
        ? {
            id: profile.id,
            service_title: profile.service_title,
            city: profile.city,
            photos: profile.photos ?? [],
            category_tags: profile.category_tags ?? [],
            price_range_min: profile.price_range_min,
            price_range_max: profile.price_range_max,
            users,
            avgRating: stats ? stats.total / stats.count : null,
            reviewCount: stats?.count ?? 0,
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
