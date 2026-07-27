export type Category = {
  slug: string
  label: string
  /** Shorter label for search chips / cards (Airbnb-style) */
  chipLabel?: string
  emoji: string
  description: string
  /**
   * Legacy free-text aliases that map to this category.
   * New writes use `slug` only — aliases exist for old data / search text.
   */
  tags: string[]
}

export const CATEGORY_SLUGS = [
  'dj',
  'fotograf',
  'musik',
  'makeup',
  'underhallning',
  'catering',
  'barnkalas',
  'brollop',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export const CATEGORIES: Category[] = [
  {
    slug: 'dj',
    label: 'DJ',
    emoji: '🎧',
    description: 'Boka en DJ till ditt kalas i Stockholm. Från bröllop till barnkalas.',
    tags: ['dj', 'DJ'],
  },
  {
    slug: 'fotograf',
    label: 'Fotograf',
    emoji: '📸',
    description: 'Hitta en fotograf som fångar dina minnen för alltid.',
    tags: ['fotografi', 'fotograf', 'Fotografi', 'Fotograf'],
  },
  {
    slug: 'musik',
    label: 'Musik & Artister',
    chipLabel: 'Musik',
    emoji: '🎵',
    description: 'Live-musik, sångare och musiker för alla typer av events.',
    tags: ['musik', 'artist', 'sångare', 'band', 'Musik', 'Artist', 'Musik & Artister'],
  },
  {
    slug: 'makeup',
    label: 'Makeup & Styling',
    chipLabel: 'Makeup',
    emoji: '💄',
    description: 'Professionell makeup och styling inför ditt stora event.',
    tags: ['makeup', 'makeupartist', 'styling', 'Makeup', 'Makeupartist', 'Makeup & Styling'],
  },
  {
    slug: 'underhallning',
    label: 'Underhållning',
    emoji: '🎭',
    description: 'Trollkarlar, komiker, akrobater och mer till ditt kalas.',
    tags: ['underhållning', 'trollkonstnär', 'komiker', 'Underhållning', 'Underhållare'],
  },
  {
    slug: 'catering',
    label: 'Catering & Kock',
    chipLabel: 'Catering',
    emoji: '👨‍🍳',
    description: 'Privatkockar och cateringtjänster för ditt event i Stockholm.',
    tags: ['catering', 'kock', 'mat', 'Catering', 'Kock', 'Catering & Kock'],
  },
  {
    slug: 'barnkalas',
    label: 'Barnkalas',
    emoji: '🎈',
    description: 'Allt du behöver för ett oförglömligt barnkalas.',
    tags: ['barnkalas', 'barn', 'barnunderhållning', 'Barnkalas', 'Ballongkonstnär'],
  },
  {
    slug: 'brollop',
    label: 'Bröllop',
    emoji: '💍',
    description: 'Talanger och tjänster specialiserade på bröllop i Stockholm.',
    tags: ['bröllop', 'Bröllop', 'wedding'],
  },
]

export function isCategorySlug(value: string | null | undefined): value is CategorySlug {
  return !!value && (CATEGORY_SLUGS as readonly string[]).includes(value)
}

export function getCategoryBySlug(slug: string | null | undefined): Category | undefined {
  if (!slug) return undefined
  return CATEGORIES.find(c => c.slug === slug)
}

/** Card / chip label for a canonical slug. */
export function formatCategoryFromSlug(slug: string | null | undefined): string | null {
  const cat = getCategoryBySlug(slug)
  if (!cat) return null
  return cat.chipLabel ?? cat.label
}

/**
 * Resolve a slug from legacy free-text tags (or a slug itself).
 * Prefer `category_slug` when available — this is for back-compat only.
 */
export function categorySlugFromTags(tags: string[] | null | undefined): CategorySlug | null {
  if (!tags?.length) return null
  const lower = tags.map(t => t.toLowerCase())
  for (const cat of CATEGORIES) {
    if (lower.includes(cat.slug)) return cat.slug as CategorySlug
    if (lower.includes(cat.label.toLowerCase())) return cat.slug as CategorySlug
    if (cat.tags.some(t => lower.includes(t.toLowerCase()))) return cat.slug as CategorySlug
  }
  return null
}

/** Prefer column slug; fall back to legacy tags. */
export function resolveCategorySlug(opts: {
  category_slug?: string | null
  category_tags?: string[] | null
}): CategorySlug | null {
  if (isCategorySlug(opts.category_slug)) return opts.category_slug
  return categorySlugFromTags(opts.category_tags)
}

/**
 * Display label for a raw tag or slug — Capitalized / mapped to catalog name.
 * Prefer formatCategoryFromSlug when you already have the column.
 */
export function formatCategoryLabel(tag: string | null | undefined): string | null {
  if (!tag?.trim()) return null
  const fromSlug = formatCategoryFromSlug(tag.trim().toLowerCase())
  if (fromSlug) return fromSlug
  const resolved = categorySlugFromTags([tag])
  if (resolved) return formatCategoryFromSlug(resolved)
  const trimmed = tag.trim()
  return trimmed.charAt(0).toLocaleUpperCase('sv-SE') + trimmed.slice(1)
}

/** Keep category_tags in sync with slug for legacy readers (portraits, old queries). */
export function categoryTagsFromSlug(slug: string | null): string[] {
  return slug ? [slug] : []
}
