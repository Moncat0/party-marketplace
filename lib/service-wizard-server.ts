import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import {
  canCreateAnotherService,
  createServiceForProvider,
  ensureProviderAndService,
  getServiceByIdForProvider,
  getServicesForProvider,
  type ServiceRow,
} from '@/lib/services'
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

/** Promote account to provider side without wiping demand history. */
export async function ensureUserIsProvider(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .maybeSingle()

  const current = data?.user_type as 'planner' | 'provider' | 'both' | null | undefined

  if (current === 'provider' || current === 'both') return

  if (!current) {
    await supabase.from('users').update({ user_type: 'provider' }).eq('id', userId)
    return
  }

  // current === planner
  // Genuine planner offering a service → both. Accidental planner (no bookings) → provider.
  const { count } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('planner_id', userId)

  const next = (count ?? 0) > 0 ? 'both' : 'provider'
  await supabase.from('users').update({ user_type: next }).eq('id', userId)
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
      cancellation_policy: null,
      photos: [],
      is_published: false,
      is_disabled: false,
    })
    .eq('id', serviceId)
}

/**
 * Load (and optionally reset / create) the draft service for the wizard flow page.
 * Redirects on auth/setup failures or when the 2-service limit is reached.
 */
export async function loadWizardFlowService(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    resume: boolean
    fresh: boolean
    paths: WizardPaths
    serviceId?: string | null
  }
): Promise<ServiceRow> {
  await ensureUserIsProvider(supabase, userId)

  const ensured = await ensureProviderAndService(supabase, userId)
  if (ensured.error || !ensured.serviceId) {
    redirect(opts.paths.afterSave)
  }

  const services = await getServicesForProvider(supabase, ensured.providerId)
  if (services.length === 0) redirect(opts.paths.afterSave)

  // Resume a specific draft (or the first incomplete one)
  if (opts.resume) {
    const target = opts.serviceId
      ? await getServiceByIdForProvider(supabase, ensured.providerId, opts.serviceId)
      : services.find(s => !s.is_published) ?? services[0]
    if (!target) redirect(opts.paths.hub)
    return target
  }

  // Start a new listing
  if (opts.fresh) {
    const blankDraft = services.find(s => !s.is_published && !serviceHasProgress(s))
    if (blankDraft) {
      await clearServiceDraft(supabase, blankDraft.id)
      redirect(`${opts.paths.flow}?id=${blankDraft.id}`)
    }

    if (!canCreateAnotherService(services.length)) {
      redirect(opts.paths.afterSave)
    }

    const created = await createServiceForProvider(supabase, ensured.providerId)
    if (created.error || !created.service) {
      redirect(opts.paths.afterSave)
    }
    redirect(`${opts.paths.flow}?id=${created.service.id}`)
  }

  // Default: open explicit id, or first unpublished, or block if all published without id
  if (opts.serviceId) {
    const target = await getServiceByIdForProvider(
      supabase,
      ensured.providerId,
      opts.serviceId
    )
    if (!target) redirect(opts.paths.hub)
    return target
  }

  const draft = services.find(s => !s.is_published)
  if (draft) return draft

  // All published and no id — don't overwrite; send to hub / listings
  redirect(opts.paths.hub)
}
