/**
 * Occasion (tillfälle) — what kind of party / celebration.
 * Orthogonal to service category (what the talent offers: DJ, fotograf, …).
 */

export const OCCASION_SLUGS = [
  'birthday',
  'kids',
  'wedding',
  'corporate',
  'graduation',
  'crayfish',
  'midsommar',
  'christmas',
  'hen_stag',
  'anniversary',
  'housewarming',
  'other',
] as const

export type OccasionSlug = (typeof OCCASION_SLUGS)[number]

export type Occasion = {
  value: OccasionSlug
  label: string
}

/** Common Swedish party occasions — used on services (multi) and booking requests (multi). */
export const OCCASIONS: Occasion[] = [
  { value: 'birthday', label: 'Födelsedag' },
  { value: 'kids', label: 'Barnkalas' },
  { value: 'wedding', label: 'Bröllop' },
  { value: 'corporate', label: 'Företagsevent' },
  { value: 'graduation', label: 'Studenten' },
  { value: 'crayfish', label: 'Kräftskiva' },
  { value: 'midsommar', label: 'Midsommar' },
  { value: 'christmas', label: 'Julfest' },
  { value: 'hen_stag', label: 'Möhippa / Svensexa' },
  { value: 'anniversary', label: 'Jubileum' },
  { value: 'housewarming', label: 'Inflyttningsfest' },
  { value: 'other', label: 'Annat' },
]

const LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  OCCASIONS.map(o => [o.value, o.label])
)

export function isOccasionSlug(value: string | null | undefined): value is OccasionSlug {
  return !!value && (OCCASION_SLUGS as readonly string[]).includes(value)
}

export function formatOccasion(value: string | null | undefined): string | null {
  if (!value) return null
  return LABEL_BY_VALUE[value] ?? value
}

export function formatOccasions(values: string[] | null | undefined): string | null {
  if (!values?.length) return null
  const labels = values.map(v => formatOccasion(v)).filter(Boolean) as string[]
  if (!labels.length) return null
  return labels.join(' · ')
}

export function normalizeOccasions(values: unknown): OccasionSlug[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<OccasionSlug>()
  for (const v of values) {
    if (typeof v === 'string' && isOccasionSlug(v) && !seen.has(v)) seen.add(v)
  }
  return OCCASION_SLUGS.filter(s => seen.has(s))
}

/** Toggle a slug in a multi-select list. */
export function toggleOccasion(current: string[], slug: OccasionSlug): OccasionSlug[] {
  const set = new Set(normalizeOccasions(current))
  if (set.has(slug)) set.delete(slug)
  else set.add(slug)
  return OCCASION_SLUGS.filter(s => set.has(s))
}
