/**
 * First-time planner discovery wizard — name → where → service → occasion → /sok.
 */

import { DEFAULT_LOCATION_ID } from '@/lib/locations'
import type { CategorySlug } from '@/lib/categories'
import type { OccasionSlug } from '@/lib/occasions'

export const PLANNER_SEARCH_STEPS = [
  'name',
  'location',
  'category',
  'occasion',
] as const

export type PlannerSearchStep = (typeof PLANNER_SEARCH_STEPS)[number]

export type PlannerSearchDraft = {
  firstName: string
  lastName: string
  locationId: string
  categorySlug: CategorySlug | null
  occasion: OccasionSlug | null
}

export const EMPTY_PLANNER_SEARCH_DRAFT: PlannerSearchDraft = {
  firstName: '',
  lastName: '',
  locationId: DEFAULT_LOCATION_ID,
  categorySlug: null,
  occasion: null,
}

/** Four equal segments — past + current filled, future empty (no half-fills). */
export function plannerSearchPhaseFills(step: PlannerSearchStep): number[] {
  const i = PLANNER_SEARCH_STEPS.indexOf(step)
  return PLANNER_SEARCH_STEPS.map((_, idx) => (idx <= i ? 1 : 0))
}

export function isPlannerSearchStepValid(
  step: PlannerSearchStep,
  draft: PlannerSearchDraft
): boolean {
  switch (step) {
    case 'name':
      return draft.firstName.trim().length > 0
    case 'location':
      return draft.locationId === DEFAULT_LOCATION_ID
    case 'category':
      return !!draft.categorySlug
    case 'occasion':
      return !!draft.occasion
    default:
      return false
  }
}

export function nextPlannerSearchStep(
  step: PlannerSearchStep
): PlannerSearchStep | null {
  const i = PLANNER_SEARCH_STEPS.indexOf(step)
  if (i < 0 || i >= PLANNER_SEARCH_STEPS.length - 1) return null
  return PLANNER_SEARCH_STEPS[i + 1]
}

export function prevPlannerSearchStep(
  step: PlannerSearchStep
): PlannerSearchStep | null {
  const i = PLANNER_SEARCH_STEPS.indexOf(step)
  if (i <= 0) return null
  return PLANNER_SEARCH_STEPS[i - 1]
}

/** Soft-gate / deep-link destinations skip the discovery steps. */
export function isPlannerDiscoveryNext(next: string | null | undefined): boolean {
  if (!next) return true
  if (next === '/') return true
  if (next.startsWith('/sok')) return true
  return false
}

export function buildSokUrl(draft: PlannerSearchDraft): string {
  const params = new URLSearchParams()
  if (draft.locationId) params.set('location', draft.locationId)
  if (draft.categorySlug) params.set('category', draft.categorySlug)
  if (draft.occasion) params.set('occasion', draft.occasion)
  const qs = params.toString()
  return qs ? `/sok?${qs}` : '/sok'
}
