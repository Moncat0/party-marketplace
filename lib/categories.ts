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

export type CategoryGroup = {
  id: string
  label: string
  emoji: string
  slugs: string[]
}

/** Talent / service type only — occasions (bröllop, barnkalas, …) live in lib/occasions. */
export const CATEGORY_SLUGS = [
  // Musik & Ljud
  'dj',
  'sangare',
  'band',
  'musiker',
  // Foto & Film
  'fotograf',
  'videograf',
  'fotobox',
  // Skönhet & Stil
  'makeup',
  'harstylist',
  // Mat & Dryck
  'privatkock',
  'catering',
  'bartender',
  // Underhållning & Show
  'magiker',
  'komiker',
  'barnunderhallning',
  'dansare',
  'mc',
  'cirkus',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export const CATEGORIES: Category[] = [
  // Musik & Ljud
  {
    slug: 'dj',
    label: 'DJ',
    emoji: '🎧',
    description: 'Boka en DJ till ditt kalas. Från bröllop till barnkalas.',
    tags: ['dj', 'DJ'],
  },
  {
    slug: 'sangare',
    label: 'Sångare / Sångerska',
    chipLabel: 'Sångare',
    emoji: '🎤',
    description: 'Solist, jazzsångare, operasångare eller pop.',
    tags: ['sångare', 'sångerska', 'solist', 'Sångare', 'Sångerska'],
  },
  {
    slug: 'band',
    label: 'Liveband',
    emoji: '🎸',
    description: 'Liveband för bröllop, fest och event.',
    tags: ['band', 'liveband', 'orkester', 'Band'],
  },
  {
    slug: 'musiker',
    label: 'Musiker',
    emoji: '🎹',
    description: 'Pianist, violinist, gitarrist eller annan instrumentalist.',
    tags: ['musiker', 'pianist', 'violinist', 'gitarrist', 'instrumentalist', 'Musiker'],
  },
  // Foto & Film
  {
    slug: 'fotograf',
    label: 'Fotograf',
    emoji: '📸',
    description: 'Hitta en fotograf som fångar dina minnen för alltid.',
    tags: ['fotografi', 'fotograf', 'Fotografi', 'Fotograf'],
  },
  {
    slug: 'videograf',
    label: 'Videograf / Film',
    chipLabel: 'Videograf',
    emoji: '🎬',
    description: 'Film och video till bröllop, fest och event.',
    tags: ['videograf', 'film', 'videofilm', 'Videograf'],
  },
  {
    slug: 'fotobox',
    label: 'Fotobox / Fotobås',
    chipLabel: 'Fotobox',
    emoji: '📷',
    description: 'Rolig fotobox eller fotobås till fester och evenemang.',
    tags: ['fotobox', 'fotobås', 'photobooth', 'Fotobox'],
  },
  // Skönhet & Stil
  {
    slug: 'makeup',
    label: 'Makeup & Styling',
    chipLabel: 'Makeup',
    emoji: '💄',
    description: 'Professionell makeup och styling inför ditt stora event.',
    tags: ['makeup', 'makeupartist', 'styling', 'Makeup', 'Makeupartist', 'Makeup & Styling'],
  },
  {
    slug: 'harstylist',
    label: 'Hårstylist',
    emoji: '✂️',
    description: 'Professionell hårstyling och frisyr till ditt event.',
    tags: ['hårstylist', 'frisör', 'frisyr', 'Hårstylist'],
  },
  // Mat & Dryck
  {
    slug: 'privatkock',
    label: 'Privatkock',
    emoji: '🍽️',
    description: 'En privatkock som lagar mat hemma hos dig.',
    tags: ['privatkock', 'kock', 'kockar', 'Privatkock', 'Kock'],
  },
  {
    slug: 'catering',
    label: 'Catering',
    emoji: '👨‍🍳',
    description: 'Cateringtjänster för ditt event.',
    tags: ['catering', 'mat', 'Catering', 'Catering & Kock'],
  },
  {
    slug: 'bartender',
    label: 'Bartender',
    emoji: '🍹',
    description: 'Professionell bartender för cocktails och drinkar.',
    tags: ['bartender', 'bartendern', 'cocktail', 'Bartender'],
  },
  // Underhållning & Show
  {
    slug: 'magiker',
    label: 'Magiker / Trollkonstnär',
    chipLabel: 'Magiker',
    emoji: '🪄',
    description: 'Magiker och trollkonstnärer för alla typer av event.',
    tags: ['magiker', 'trollkonstnär', 'trollkonstnaren', 'Magiker', 'Trollkonstnär'],
  },
  {
    slug: 'komiker',
    label: 'Komiker / Ståupp',
    chipLabel: 'Komiker',
    emoji: '🎤',
    description: 'Ståuppkomiker och humorister till ditt event.',
    tags: ['komiker', 'ståupp', 'stand-up', 'humorist', 'Komiker'],
  },
  {
    slug: 'barnunderhallning',
    label: 'Barnunderhållning',
    emoji: '🎪',
    description: 'Underhållning anpassad för barn och familjer.',
    tags: ['barnunderhållning', 'barnkalas', 'barnens', 'Barnunderhållning'],
  },
  {
    slug: 'dansare',
    label: 'Dansare / Koreograf',
    chipLabel: 'Dansare',
    emoji: '💃',
    description: 'Dansare och koreografer för show och event.',
    tags: ['dansare', 'dansös', 'koreograf', 'Dansare'],
  },
  {
    slug: 'mc',
    label: 'MC / Konferencier',
    chipLabel: 'MC',
    emoji: '🎙️',
    description: 'Värd och konferencier som håller ihop ditt event.',
    tags: ['mc', 'konferencier', 'värd', 'toastmaster', 'MC', 'Konferencier'],
  },
  {
    slug: 'cirkus',
    label: 'Cirkus & Akrobat',
    chipLabel: 'Cirkus',
    emoji: '🎡',
    description: 'Cirkusartister, akrobater och ildansare.',
    tags: ['cirkus', 'akrobat', 'ildansare', 'Cirkus', 'Akrobat'],
  },
]

/** Grouped structure for the category picker UI */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'musik',
    label: 'Musik & Ljud',
    emoji: '🎵',
    slugs: ['dj', 'sangare', 'band', 'musiker'],
  },
  {
    id: 'foto',
    label: 'Foto & Film',
    emoji: '📸',
    slugs: ['fotograf', 'videograf', 'fotobox'],
  },
  {
    id: 'skonhet',
    label: 'Skönhet & Stil',
    emoji: '💅',
    slugs: ['makeup', 'harstylist'],
  },
  {
    id: 'mat',
    label: 'Mat & Dryck',
    emoji: '🍽️',
    slugs: ['privatkock', 'catering', 'bartender'],
  },
  {
    id: 'underhallning',
    label: 'Underhållning & Show',
    emoji: '🎭',
    slugs: ['magiker', 'komiker', 'barnunderhallning', 'dansare', 'mc', 'cirkus'],
  },
]

/** Map retired occasion-as-category slugs → closest talent category. */
const LEGACY_CATEGORY_SLUG_MAP: Record<string, CategorySlug> = {
  barnkalas: 'barnunderhallning',
  brollop: 'fotograf',
  // kept for data written before category expansion
  underhallning: 'magiker',
  musik: 'sangare',
}

export function isCategorySlug(value: string | null | undefined): value is CategorySlug {
  return !!value && (CATEGORY_SLUGS as readonly string[]).includes(value)
}

export function getCategoryBySlug(slug: string | null | undefined): Category | undefined {
  if (!slug) return undefined
  const canonical = LEGACY_CATEGORY_SLUG_MAP[slug] ?? slug
  return CATEGORIES.find(c => c.slug === canonical)
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
  // Retired occasion categories stored as tags
  for (const [legacy, next] of Object.entries(LEGACY_CATEGORY_SLUG_MAP)) {
    if (lower.includes(legacy) || lower.includes(legacy === 'brollop' ? 'bröllop' : legacy)) {
      return next
    }
  }
  return null
}

/** Prefer column slug; fall back to legacy tags. */
export function resolveCategorySlug(opts: {
  category_slug?: string | null
  category_tags?: string[] | null
}): CategorySlug | null {
  if (opts.category_slug && LEGACY_CATEGORY_SLUG_MAP[opts.category_slug]) {
    return LEGACY_CATEGORY_SLUG_MAP[opts.category_slug]
  }
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
