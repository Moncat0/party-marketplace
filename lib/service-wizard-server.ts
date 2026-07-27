import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { ensureProviderAndService, getServiceForProvider, type ServiceRow } from '@/lib/services'
import { DEFAULT_LOCATION_ID, getLocationLabel } from '@/lib/locations'

export type WizardPaths = {
  hub: string
  flow: string
  afterSave: string
  afterPublish: string
}

export const ONBOARDING_WIZARD_PATHS: WizardPaths = {
  hub: '/onboarding',
  flow: '/onboarding/flow',
  afterSave: '/dashboard',
  afterPublish: '/dashboard',
}

export const DASHBOARD_WIZARD_PATHS: WizardPaths = {
  hub: '/dashboard/listings/new',
  flow: '/dashboard/listings/new/flow',
  afterSave: '/dashboard/listings',
  afterPublish: '/dashboard/listings',
}

export function serviceHasProgress(service: ServiceRow | null): boolean {
  if (!service || service.is_published) return false
  return Boolean(
    service.title?.trim() ||
      service.description?.trim() ||
      !!service.category_slug ||
      (service.category_tags && service.category_tags.length > 0) ||
      (service.photos && service.photos.length > 0) ||
      service.price_range_min != null ||
      service.price_range_max != null
  )
}

/** Promote planner → both, otherwise provider. */
export async function ensureUserIsProvider(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle()

  const next =
    data?.user_type === 'planner' || data?.user_type === 'both' ? 'both' : 'provider'

  if (data?.user_type !== next) {
    await supabase.from('users').update({ user_type: next }).eq('id', userId)
  }
}

export async function clearServiceDraft(
  supabase: SupabaseClient,
  serviceId: string
): Promise<void> {
  await supabase
    .from('services')
    .update({
      title: null,
      description: null,
      category_slug: null,
      category_tags: [],
      city: getLocationLabel(DEFAULT_LOCATION_ID),
      location_id: DEFAULT_LOCATION_ID,
      price_range_min: null,
      price_range_max: null,
      photos: [],
      is_published: false,
    })
    .eq('id', serviceId)
}

/**
 * Load (and optionally reset) the draft service for the wizard flow page.
 * Redirects on auth/setup failures.
 */
export async function loadWizardFlowService(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    resume: boolean
    fresh: boolean
    paths: WizardPaths
  }
): Promise<ServiceRow> {
  await ensureUserIsProvider(supabase, userId)

  const ensured = await ensureProviderAndService(supabase, userId)
  if (ensured.error || !ensured.serviceId) {
    redirect(opts.paths.afterSave)
  }

  let service = await getServiceForProvider(supabase, ensured.providerId)
  if (!service) redirect(opts.paths.afterSave)

  if (service.is_published && !opts.resume) {
    redirect(opts.paths.afterPublish)
  }

  if (opts.fresh && !service.is_published) {
    await clearServiceDraft(supabase, service.id)
    redirect(opts.paths.flow)
  }

  return service
}
