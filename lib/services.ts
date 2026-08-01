import type { SupabaseClient } from '@supabase/supabase-js'

/** Soft limit — providers may publish/create up to this many services. */
export const MAX_SERVICES_PER_PROVIDER = 2

export type ServiceRow = {
  id: string
  provider_profile_id: string
  title: string | null
  description: string | null
  category_slug: string | null
  category_tags: string[] | null
  occasions: string[] | null
  city: string | null
  location_id: string | null
  price_range_min: number | null
  price_range_max: number | null
  cancellation_policy?: string | null
  photos: string[] | null
  is_published: boolean
  is_disabled: boolean
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

export async function getServicesForProvider(
  supabase: SupabaseClient,
  providerProfileId: string
): Promise<ServiceRow[]> {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('provider_profile_id', providerProfileId)
    .order('created_at', { ascending: true })
  return (data ?? []) as ServiceRow[]
}

/** Oldest service for the provider — kept for call sites that still expect one. */
export async function getServiceForProvider(
  supabase: SupabaseClient,
  providerProfileId: string
): Promise<ServiceRow | null> {
  const services = await getServicesForProvider(supabase, providerProfileId)
  return services[0] ?? null
}

export async function getServiceByIdForProvider(
  supabase: SupabaseClient,
  providerProfileId: string,
  serviceId: string
): Promise<ServiceRow | null> {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('provider_profile_id', providerProfileId)
    .eq('id', serviceId)
    .maybeSingle()
  return data as ServiceRow | null
}

export async function getServicesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  provider: ProviderProfileRow
  services: ServiceRow[]
  /** First / primary service (oldest). */
  service: ServiceRow | null
} | null> {
  const provider = await getProviderForUser(supabase, userId)
  if (!provider) return null
  const services = await getServicesForProvider(supabase, provider.id)
  return { provider, services, service: services[0] ?? null }
}

/** @deprecated Prefer getServicesForUser — returns first service only. */
export async function getServiceForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ provider: ProviderProfileRow; service: ServiceRow | null } | null> {
  const result = await getServicesForUser(supabase, userId)
  if (!result) return null
  return { provider: result.provider, service: result.service }
}

export function canCreateAnotherService(serviceCount: number): boolean {
  return serviceCount < MAX_SERVICES_PER_PROVIDER
}

/** Visible in browse/search/sitemap — published and not paused. */
export function isServicePubliclyListed(service: {
  is_published: boolean
  is_disabled?: boolean | null
}): boolean {
  return service.is_published && !service.is_disabled
}

/** Insert a blank services row if under the soft limit. */
export async function createServiceForProvider(
  supabase: SupabaseClient,
  providerProfileId: string
): Promise<{ service: ServiceRow | null; error: string | null }> {
  const existing = await getServicesForProvider(supabase, providerProfileId)
  if (!canCreateAnotherService(existing.length)) {
    return {
      service: null,
      error: `Du kan ha högst ${MAX_SERVICES_PER_PROVIDER} tjänster.`,
    }
  }

  const { data, error } = await supabase
    .from('services')
    .insert({ provider_profile_id: providerProfileId })
    .select('*')
    .single()

  if (error || !data) {
    return { service: null, error: error?.message ?? 'Could not create service' }
  }
  return { service: data as ServiceRow, error: null }
}

/** Ensure provider_profiles + at least one services row for onboarding. */
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

  let services = await getServicesForProvider(supabase, provider.id)
  if (services.length === 0) {
    const created = await createServiceForProvider(supabase, provider.id)
    if (created.error || !created.service) {
      return {
        providerId: provider.id,
        serviceId: '',
        error: created.error ?? 'Could not create service',
      }
    }
    services = [created.service]
  }

  return { providerId: provider.id, serviceId: services[0].id, error: null }
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
  is_disabled,
  view_count,
  created_at,
  provider_profiles (
    id,
    user_id,
    bio,
    users ( name, first_name, last_name, preferred_first_name, avatar_url )
  )
`
