export type Category = {
  slug: string
  label: string
  emoji: string
  description: string
  /** Tags in the DB that map to this category */
  tags: string[]
}

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
    emoji: '🎵',
    description: 'Live-musik, sångare och musiker för alla typer av events.',
    tags: ['musik', 'artist', 'sångare', 'band', 'Musik', 'Artist'],
  },
  {
    slug: 'makeup',
    label: 'Makeup & Styling',
    emoji: '💄',
    description: 'Professionell makeup och styling inför ditt stora event.',
    tags: ['makeup', 'makeupartist', 'styling', 'Makeup', 'Makeupartist'],
  },
  {
    slug: 'underhallning',
    label: 'Underhållning',
    emoji: '🎭',
    description: 'Trollkarlar, komiker, akrobater och mer till ditt kalas.',
    tags: ['underhållning', 'trollkonstnär', 'komiker', 'Underhållning'],
  },
  {
    slug: 'catering',
    label: 'Catering & Kock',
    emoji: '👨‍🍳',
    description: 'Privatkockar och cateringtjänster för ditt event i Stockholm.',
    tags: ['catering', 'kock', 'mat', 'Catering', 'Kock'],
  },
  {
    slug: 'barnkalas',
    label: 'Barnkalas',
    emoji: '🎈',
    description: 'Allt du behöver för ett oförglömligt barnkalas.',
    tags: ['barnkalas', 'barn', 'barnunderhållning', 'Barnkalas'],
  },
  {
    slug: 'brollop',
    label: 'Bröllop',
    emoji: '💍',
    description: 'Talanger och tjänster specialiserade på bröllop i Stockholm.',
    tags: ['bröllop', 'Bröllop', 'wedding'],
  },
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug)
}
