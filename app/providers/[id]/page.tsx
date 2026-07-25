import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProviderProfile from './ProviderProfile'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('service_title, service_description, photos, city, users(name)')
    .eq('id', params.id)
    .single()

  if (!profile) return {}

  const user = profile.users as { name: string | null } | null
  const title = profile.service_title ?? user?.name ?? 'Talang'
  const description = profile.service_description?.slice(0, 160) ?? `Boka ${title} i ${profile.city ?? 'Stockholm'} via FESTEN.`
  const image = profile.photos?.[0]

  return {
    title,
    description,
    openGraph: {
      title: `${title} | FESTEN.`,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
  }
}

export default async function ProviderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('*, users(name, avatar_url)')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!profile) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, comment, created_at, users!reviewer_id(name, avatar_url)')
    .eq('reviewee_id', profile.user_id)
    .order('created_at', { ascending: false })

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

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
        .eq('provider_profile_id', params.id)
        .in(
          'shortlist_id',
          lists.map(l => l.id)
        )
        .limit(1)
        .maybeSingle()
      isSaved = !!item
    }
  }

  return (
    <ProviderProfile
      profile={profile}
      reviews={reviews ?? []}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
      currentUserId={user?.id ?? null}
      isSaved={isSaved}
    />
  )
}
