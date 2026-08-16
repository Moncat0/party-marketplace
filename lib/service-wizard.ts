import {
  CATEGORIES,
  categoryTagsFromSlug,
  resolveCategorySlug,
  type CategorySlug,
} from '@/lib/categories'
import { DEFAULT_LOCATION_ID } from '@/lib/locations'
import { normalizeOccasions, type OccasionSlug } from '@/lib/occasions'

export const SERVICE_WIZARD_STEPS = [
  'intro1',
  'title',
  'description',
  'category',
  'occasions',
  'location',
  'photos',
  'price',
  'publish',
] as const

export type ServiceWizardStep = (typeof SERVICE_WIZARD_STEPS)[number]

/** Account steps prepended for first-time provider publish. */
export const ACCOUNT_WIZARD_STEPS = ['bio', 'basedIn'] as const
export type AccountWizardStep = (typeof ACCOUNT_WIZARD_STEPS)[number]

export type FirstPublishStep = AccountWizardStep | ServiceWizardStep

export const FIRST_PUBLISH_STEPS: FirstPublishStep[] = [
  ...ACCOUNT_WIZARD_STEPS,
  ...SERVICE_WIZARD_STEPS,
]

export type ServiceWizardDraft = {
  title: string
  categorySlug: CategorySlug | null
  /** Free-text category label when categorySlug is null (stored in category_tags). */
  customCategoryLabel: string
  occasions: OccasionSlug[]
  locationId: string
  description: string
  photos: string[]
  priceMin: string
  priceMax: string
  canTravel: boolean
}

export type AccountWizardDraft = {
  firstName: string
  lastName: string
  bio: string
  basedInLocationId: string
}

export const EMPTY_WIZARD_DRAFT: ServiceWizardDraft = {
  title: '',
  categorySlug: null,
  customCategoryLabel: '',
  occasions: [],
  locationId: DEFAULT_LOCATION_ID,
  description: '',
  photos: [],
  priceMin: '',
  priceMax: '',
  canTravel: false,
}

export const EMPTY_ACCOUNT_DRAFT: AccountWizardDraft = {
  firstName: '',
  lastName: '',
  bio: '',
  basedInLocationId: DEFAULT_LOCATION_ID,
}

/** Two phases for returning providers (new listing). */
export const WIZARD_PHASES: ServiceWizardStep[][] = [
  ['intro1', 'title', 'description', 'category', 'occasions', 'location', 'photos'],
  ['price', 'publish'],
]

/** Three phases for first publish: Din profil → Din tjänst → Publicera. */
export const FIRST_PUBLISH_PHASES: FirstPublishStep[][] = [
  ['bio', 'basedIn'],
  ['intro1', 'title', 'description', 'category', 'occasions', 'location', 'photos'],
  ['price', 'publish'],
]

export function stepIndex(step: ServiceWizardStep): number {
  return SERVICE_WIZARD_STEPS.indexOf(step)
}

export function firstPublishStepIndex(step: FirstPublishStep): number {
  return FIRST_PUBLISH_STEPS.indexOf(step)
}

export function isAccountWizardStep(step: string): step is AccountWizardStep {
  return (ACCOUNT_WIZARD_STEPS as readonly string[]).includes(step)
}

export function isServiceWizardStep(step: string): step is ServiceWizardStep {
  return (SERVICE_WIZARD_STEPS as readonly string[]).includes(step)
}

function phaseProgressFrom(
  phases: readonly (readonly string[])[],
  allSteps: readonly string[],
  step: string
): number[] {
  const idx = allSteps.indexOf(step)
  return phases.map(phase => {
    const first = allSteps.indexOf(phase[0])
    const last = allSteps.indexOf(phase[phase.length - 1])
    if (idx < first) return 0
    if (idx > last) return 1
    const local = idx - first
    return (local + 1) / phase.length
  })
}

export function phaseProgress(step: ServiceWizardStep): number[] {
  return phaseProgressFrom(WIZARD_PHASES, SERVICE_WIZARD_STEPS, step)
}

export function firstPublishPhaseProgress(step: FirstPublishStep): number[] {
  return phaseProgressFrom(FIRST_PUBLISH_PHASES, FIRST_PUBLISH_STEPS, step)
}

export function nextStep(step: ServiceWizardStep): ServiceWizardStep | null {
  const i = stepIndex(step)
  if (i < 0 || i >= SERVICE_WIZARD_STEPS.length - 1) return null
  return SERVICE_WIZARD_STEPS[i + 1]
}

export function prevStep(step: ServiceWizardStep): ServiceWizardStep | null {
  const i = stepIndex(step)
  if (i <= 0) return null
  return SERVICE_WIZARD_STEPS[i - 1]
}

export function nextFirstPublishStep(step: FirstPublishStep): FirstPublishStep | null {
  const i = firstPublishStepIndex(step)
  if (i < 0 || i >= FIRST_PUBLISH_STEPS.length - 1) return null
  return FIRST_PUBLISH_STEPS[i + 1]
}

export function prevFirstPublishStep(step: FirstPublishStep): FirstPublishStep | null {
  const i = firstPublishStepIndex(step)
  if (i <= 0) return null
  return FIRST_PUBLISH_STEPS[i - 1]
}

export function isStepValid(step: ServiceWizardStep, draft: ServiceWizardDraft): boolean {
  switch (step) {
    case 'intro1':
    case 'publish':
      return true
    case 'title':
      return draft.title.trim().length > 0 && draft.title.trim().length <= 50
    case 'description':
      return draft.description.trim().length > 0 && draft.description.trim().length <= 500
    case 'category':
      return (
        (!!draft.categorySlug && CATEGORIES.some(c => c.slug === draft.categorySlug)) ||
        draft.customCategoryLabel.trim().length >= 2
      )
    case 'occasions':
      return draft.occasions.length >= 1
    case 'location':
      return !!draft.locationId
    case 'photos':
      return draft.photos.length >= 1 && draft.photos.length <= 6
    case 'price': {
      const min = Number(draft.priceMin)
      const max = Number(draft.priceMax)
      return Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min
    }
    default:
      return false
  }
}

export function isAccountStepValid(
  step: AccountWizardStep,
  draft: AccountWizardDraft
): boolean {
  switch (step) {
    case 'bio':
      return true // optional
    case 'basedIn':
      return !!draft.basedInLocationId
    default:
      return false
  }
}

/** Resume at first incomplete content step. */
export function resumeStep(draft: ServiceWizardDraft): ServiceWizardStep {
  if (!draft.title.trim()) return 'intro1'
  if (!draft.description.trim()) return 'description'
  if (!draft.categorySlug) return 'category'
  if (draft.occasions.length < 1) return 'occasions'
  if (!draft.locationId) return 'location'
  if (draft.photos.length < 1) return 'photos'
  if (!draft.priceMin || !draft.priceMax) return 'price'
  return 'publish'
}

/** First-time publish: always start at bio (Part A), then resume listing draft. */
export function resumeFirstPublishStep(opts: {
  needsBio: boolean
  needsBasedIn?: boolean
  draft: ServiceWizardDraft
  resumeListing: boolean
}): FirstPublishStep {
  if (opts.needsBio) return 'bio'
  if (opts.needsBasedIn) return 'basedIn'
  if (opts.resumeListing) return resumeStep(opts.draft)
  return 'intro1'
}

/** @deprecated use categoryTagsFromSlug from lib/categories */
export function categoryTagFromSlug(slug: string | null): string[] {
  return categoryTagsFromSlug(slug)
}

/** @deprecated use resolveCategorySlug / categorySlugFromTags from lib/categories */
export { categorySlugFromTags } from '@/lib/categories'

export function draftFromService(service: {
  title: string | null
  description: string | null
  category_slug?: string | null
  category_tags: string[] | null
  occasions?: string[] | null
  location_id?: string | null
  photos: string[] | null
  price_range_min: number | null
  price_range_max: number | null
  can_travel?: boolean | null
} | null): ServiceWizardDraft {
  if (!service) return { ...EMPTY_WIZARD_DRAFT }
  const categorySlug = resolveCategorySlug({
    category_slug: service.category_slug,
    category_tags: service.category_tags,
  })
  // If no known slug, the first category_tag is a custom label written by the provider.
  const customCategoryLabel =
    !categorySlug && service.category_tags?.length ? service.category_tags[0] : ''
  return {
    title: service.title ?? '',
    categorySlug,
    customCategoryLabel,
    occasions: normalizeOccasions(service.occasions),
    locationId: service.location_id ?? DEFAULT_LOCATION_ID,
    description: service.description ?? '',
    photos: service.photos ?? [],
    priceMin: service.price_range_min?.toString() ?? '',
    priceMax: service.price_range_max?.toString() ?? '',
    canTravel: !!service.can_travel,
  }
}

export function isIncompleteService(service: {
  is_published: boolean
} | null): boolean {
  if (!service || service.is_published) return false
  return true
}

export function serviceStartedLabel(createdAt: string): string {
  const d = new Date(createdAt)
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
}
