import type { SupabaseClient } from '@supabase/supabase-js'

export type ServiceRow = {
  id: string
  provider_profile_id: string
  title: string | null
  description: string | null
  category_slug: string | null
  category_tags: string[] | null
  city: string | null
  location_id: string | null
  price_range_min: number | null
  price_range_max: number | null
  photos: string[] | null
  is_published: boolean
  view_count: number
  created_at: string
  updated_at?: string
}

export type ProviderProfileRow = {
  id: string
  user_id: string
  city: string | null
  location_id: string | null
  bio: string | null
  party_animal_portrait_url: string | null
  stripe_account_id?: string | null
  stripe_onboarded?: boolean
  created_at: string
}

/** Listing card / browse shape (service + optional host user). */
export type ServiceListing = ServiceRow & {
  users?: { name: string | null; avatar_url: string | null } | null
  provider_profiles?: {
    id: string
    user_id: string
    bio?: string | null
    users?: { name: string | null; avatar_url: string | null } | null
  } | null
  avgRating?: number | null
  reviewCount?: number
}

export async function getProviderForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ProviderProfileRow | null> {
  const { data } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data as ProviderProfileRow | null
}

export async function getServiceForProvider(
  supabase: SupabaseClient,
  providerProfileId: string
): Promise<ServiceRow | null> {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('provider_profile_id', providerProfileId)
    .maybeSingle()
  return data as ServiceRow | null
}

export async function getServiceForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ provider: ProviderProfileRow; service: ServiceRow | null } | null> {
  const provider = await getProviderForUser(supabase, userId)
  if (!provider) return null
  const service = await getServiceForProvider(supabase, provider.id)
  return { provider, service }
}

/** Ensure provider_profiles + single services row for onboarding. */
export async function ensureProviderAndService(
  supabase: SupabaseClient,
  userId: string
): Promise<{ providerId: string; serviceId: string; error: string | null }> {
  let provider = await getProviderForUser(supabase, userId)
  if (!provider) {
    const { data, error } = await supabase
      .from('provider_profiles')
      .insert({ user_id: userId })
      .select('*')
      .single()
    if (error || !data) {
      return { providerId: '', serviceId: '', error: error?.message ?? 'Could not create provider' }
    }
    provider = data as ProviderProfileRow
  }

  let service = await getServiceForProvider(supabase, provider.id)
  if (!service) {
    const { data, error } = await supabase
      .from('services')
      .insert({ provider_profile_id: provider.id })
      .select('*')
      .single()
    if (error || !data) {
      return {
        providerId: provider.id,
        serviceId: '',
        error: error?.message ?? 'Could not create service',
      }
    }
    service = data as ServiceRow
  }

  return { providerId: provider.id, serviceId: service.id, error: null }
}

export const PUBLISHED_SERVICE_SELECT = `
  id,
  provider_profile_id,
  title,
  description,
  category_slug,
  category_tags,
  city,
  location_id,
  price_range_min,
  price_range_max,
  photos,
  is_published,
  view_count,
  created_at,
  provider_profiles (
    id,
    user_id,
    bio,
    users ( name, avatar_url )
  )
`
