'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import ListingCard from '@/components/listings/ListingCard'
import { RESULTS_SHELL } from '@/components/listings/ListingRow'
import BrowseSearch from '@/components/navbar/BrowseSearch'
import ResultsSearchPill from '@/components/navbar/ResultsSearchPill'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CATEGORIES, getCategoryBySlug, resolveCategorySlug } from '@/lib/categories'
import { getLocationLabel, locationIdFromCity, DEFAULT_LOCATION_ID } from '@/lib/locations'
import { track } from '@/lib/posthog'
import { cn } from '@/lib/utils'

type Provider = {
  id: string
  title: string | null
  city: string | null
  location_id?: string | null
  photos: string[]
  category_slug?: string | null
  category_tags: string[]
  created_at: string
  reviewCount: number
  avgRating: number | null
  price_range_min?: number | null
  users: { name: string | null; avatar_url: string | null } | null
}

type Props = {
  providers: Provider[]
  isLoggedIn: boolean
  plannerId: string | null
  initialLocationId: string
  initialCategory: string | null
  initialQuery: string
  initialSort: string
}

type SortKey = 'relevant' | 'rating' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevant', label: 'Relevans' },
  { key: 'rating', label: 'Högst betyg' },
  { key: 'price_asc', label: 'Lägsta pris' },
  { key: 'price_desc', label: 'Högsta pris' },
]

export default function SearchResults({
  providers,
  isLoggedIn,
  plannerId,
  initialLocationId,
  initialCategory,
  initialQuery,
  initialSort,
}: Props) {
  const router = useRouter()
  const [locationId, setLocationId] = useState(initialLocationId)
  const [category, setCategory] = useState<string | null>(initialCategory)
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortKey>(
    (['relevant', 'rating', 'price_asc', 'price_desc'].includes(initialSort)
      ? initialSort
      : 'relevant') as SortKey
  )
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [orderMenuOpen, setOrderMenuOpen] = useState(false)
  const [editingSearch, setEditingSearch] = useState(false)
  const [editSegment, setEditSegment] = useState<'where' | 'service' | null>(null)
  const [draftPriceMin, setDraftPriceMin] = useState('')
  const [draftPriceMax, setDraftPriceMax] = useState('')
  const tracked = useRef(false)
  const editRootRef = useRef<HTMLDivElement>(null)

  function expandSearch(segment: 'where' | 'service') {
    setCategoryMenuOpen(false)
    setOrderMenuOpen(false)
    setFiltersOpen(false)
    setEditSegment(segment)
    setEditingSearch(true)
  }

  function collapseSearch() {
    setEditingSearch(false)
    setEditSegment(null)
  }

  useEffect(() => {
    if (!editingSearch) return
    function onDoc(e: MouseEvent) {
      if (!editRootRef.current?.contains(e.target as Node)) collapseSearch()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') collapseSearch()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [editingSearch])

  useEffect(() => {
    setLocationId(initialLocationId)
    setCategory(initialCategory)
    setQuery(initialQuery)
  }, [initialLocationId, initialCategory, initialQuery])

  const filtered = useMemo(() => {
    let list = [...providers]

    if (locationId) {
      list = list.filter(p => {
        const id = p.location_id ?? locationIdFromCity(p.city)
        return id === locationId
      })
    }

    if (category) {
      list = list.filter(
        p =>
          resolveCategorySlug({
            category_slug: p.category_slug,
            category_tags: p.category_tags,
          }) === category
      )
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p => {
        const slug = resolveCategorySlug({
          category_slug: p.category_slug,
          category_tags: p.category_tags,
        })
        const catLabel = slug ? getCategoryBySlug(slug)?.label.toLowerCase() : ''
        return (
          p.title?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          catLabel?.includes(q) ||
          p.category_tags.some(t => t.toLowerCase().includes(q))
        )
      })
    }

    const min = priceMin ? Number(priceMin) : null
    const max = priceMax ? Number(priceMax) : null
    if (min != null && !Number.isNaN(min)) {
      list = list.filter(p => (p.price_range_min ?? 0) >= min)
    }
    if (max != null && !Number.isNaN(max)) {
      list = list.filter(p => (p.price_range_min ?? 0) <= max)
    }

    if (sort === 'rating') {
      list.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    } else if (sort === 'price_asc') {
      list.sort((a, b) => (a.price_range_min ?? 1e9) - (b.price_range_min ?? 1e9))
    } else if (sort === 'price_desc') {
      list.sort((a, b) => (b.price_range_min ?? 0) - (a.price_range_min ?? 0))
    }

    return list
  }, [providers, locationId, category, query, sort, priceMin, priceMax])

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('search_performed', {
      query,
      city: locationId,
      category,
      results_count: filtered.length,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pushSearch(next?: {
    locationId?: string
    category?: string | null
    query?: string
    sort?: SortKey
  }) {
    const loc = next?.locationId ?? locationId
    const cat = next?.category === undefined ? category : next.category
    const q = next?.query ?? query
    const s = next?.sort ?? sort
    const params = new URLSearchParams()
    if (loc) params.set('location', loc)
    if (cat) params.set('category', cat)
    if (q.trim()) params.set('q', q.trim())
    if (s && s !== 'relevant') params.set('sort', s)
    router.push(`/sok?${params.toString()}`)
  }

  function openFilters() {
    setDraftPriceMin(priceMin)
    setDraftPriceMax(priceMax)
    setCategoryMenuOpen(false)
    setOrderMenuOpen(false)
    setFiltersOpen(true)
  }

  function applyFilters() {
    setPriceMin(draftPriceMin)
    setPriceMax(draftPriceMax)
    setFiltersOpen(false)
  }

  function clearPriceFilters() {
    setDraftPriceMin('')
    setDraftPriceMax('')
    setPriceMin('')
    setPriceMax('')
    setFiltersOpen(false)
  }

  const catMeta = category ? getCategoryBySlug(category) : null
  const locationLabel = getLocationLabel(locationId || DEFAULT_LOCATION_ID)
  const serviceLabel = catMeta?.chipLabel ?? catMeta?.label ?? 'All services'
  const headingNoun = catMeta
    ? `${catMeta.chipLabel ?? catMeta.label}`.toLowerCase()
    : 'tjänster'
  const priceFilterActive = !!priceMin || !!priceMax
  const orderLabel =
    SORT_OPTIONS.find(o => o.key === sort)?.label === 'Relevans'
      ? 'Order'
      : SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Order'

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        currentMode="planner"
        scrolled
        searchExpanded={editingSearch}
        center={
          <div
            ref={editRootRef}
            className={cn(
              'flex w-full justify-center',
              editingSearch && 'relative z-30'
            )}
          >
            {editingSearch ? (
              <div
                className="w-[680px] max-w-[min(100vw-2rem,680px)] origin-center"
                style={{
                  animation: 'festen-search-expand 320ms cubic-bezier(0.2, 0, 0, 1) both',
                }}
              >
                {/* Exact homepage pill size (680 × full Var/Tjänst height) */}
                <BrowseSearch
                  initialOpen={editSegment}
                  query={query}
                  onQueryChange={setQuery}
                  activeCategory={category}
                  onCategoryChange={setCategory}
                  locationId={locationId}
                  onLocationChange={setLocationId}
                  onSubmitSearch={({ locationId: loc, category: cat, query: q }) => {
                    setLocationId(loc)
                    setCategory(cat)
                    setQuery(q)
                    collapseSearch()
                    pushSearch({ locationId: loc, category: cat, query: q })
                  }}
                />
              </div>
            ) : (
              <ResultsSearchPill
                locationLabel={locationLabel}
                serviceLabel={serviceLabel}
                onExpand={expandSearch}
                onSearch={() => pushSearch()}
              />
            )}
          </div>
        }
        subnav={
          <div
            className={cn(
              'flex w-max max-w-full flex-wrap items-center justify-center gap-1.5',
              // Filters stay out of the way; header height comes from searchExpanded.
              editingSearch && 'hidden'
            )}
            aria-hidden={editingSearch}
          >
            <Button
              type="button"
              variant="outline"
              onClick={openFilters}
              className={cn(
                'h-9 flex-shrink-0 gap-1.5 rounded-full border px-3.5 text-[13px] font-medium shadow-none',
                priceFilterActive
                  ? 'border-foreground bg-background'
                  : 'border-border hover:border-foreground'
              )}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="5" cy="4.5" r="1.25" fill="currentColor" />
                <circle cx="11" cy="8" r="1.25" fill="currentColor" />
                <circle cx="7.5" cy="11.5" r="1.25" fill="currentColor" />
              </svg>
              Filters
              {priceFilterActive && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                  1
                </span>
              )}
            </Button>

            <div className="mx-0.5 h-5 w-px flex-shrink-0 bg-border" aria-hidden />

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCategoryMenuOpen(v => !v)
                  setOrderMenuOpen(false)
                  setFiltersOpen(false)
                }}
                className={cn(
                  'h-9 flex-shrink-0 gap-1.5 rounded-full border px-3.5 text-[13px] font-medium shadow-none',
                  category || categoryMenuOpen
                    ? 'border-foreground bg-background'
                    : 'border-border hover:border-foreground'
                )}
              >
                {catMeta?.chipLabel ?? catMeta?.label ?? 'Category'}
                <ChevronDown />
              </Button>
              {categoryMenuOpen && (
                <ChipMenu onClose={() => setCategoryMenuOpen(false)}>
                  <ChipMenuItem
                    label="All services"
                    active={!category}
                    onClick={() => {
                      setCategory(null)
                      setCategoryMenuOpen(false)
                      pushSearch({ category: null })
                    }}
                  />
                  {CATEGORIES.map(c => (
                    <ChipMenuItem
                      key={c.slug}
                      label={c.label}
                      active={category === c.slug}
                      onClick={() => {
                        setCategory(c.slug)
                        setCategoryMenuOpen(false)
                        pushSearch({ category: c.slug })
                      }}
                    />
                  ))}
                </ChipMenu>
              )}
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOrderMenuOpen(v => !v)
                  setCategoryMenuOpen(false)
                  setFiltersOpen(false)
                }}
                className={cn(
                  'h-9 flex-shrink-0 gap-1.5 rounded-full border px-3.5 text-[13px] font-medium shadow-none',
                  sort !== 'relevant' || orderMenuOpen
                    ? 'border-foreground bg-background'
                    : 'border-border hover:border-foreground'
                )}
              >
                {orderLabel}
                <ChevronDown />
              </Button>
              {orderMenuOpen && (
                <ChipMenu onClose={() => setOrderMenuOpen(false)}>
                  {SORT_OPTIONS.map(o => (
                    <ChipMenuItem
                      key={o.key}
                      label={o.label}
                      active={sort === o.key}
                      onClick={() => {
                        setSort(o.key)
                        setOrderMenuOpen(false)
                        pushSearch({ sort: o.key })
                      }}
                    />
                  ))}
                </ChipMenu>
              )}
            </div>
          </div>
        }
      />

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl p-0 sm:rounded-3xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-center text-[16px] font-semibold">Filters</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-6 py-6">
            <h3 className="text-[18px] font-semibold text-foreground">Price range</h3>
            <p className="text-[14px] text-muted-foreground">From-price per booking (SEK)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price-min" className="text-[12px] text-muted-foreground">
                  Minimum
                </Label>
                <input
                  id="price-min"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftPriceMin}
                  onChange={e => setDraftPriceMin(e.target.value)}
                  placeholder="0"
                  className="h-12 rounded-xl border border-input px-4 text-[15px] text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price-max" className="text-[12px] text-muted-foreground">
                  Maximum
                </Label>
                <input
                  id="price-max"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftPriceMax}
                  onChange={e => setDraftPriceMax(e.target.value)}
                  placeholder="Any"
                  className="h-12 rounded-xl border border-input px-4 text-[15px] text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="link"
              onClick={clearPriceFilters}
              className="h-auto p-0 underline"
            >
              Clear all
            </Button>
            <Button type="button" variant="dark" onClick={applyFilters} className="rounded-lg px-6">
              Show results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`${RESULTS_SHELL} py-6 md:py-8`}>
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.02em] text-foreground md:text-[22px]">
          Utforska {filtered.length} {headingNoun}
          {locationLabel ? ` i ${locationLabel}` : ''}
        </h1>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-4 text-4xl">🎭</p>
            <p className="mb-2 text-lg font-semibold text-foreground">Inga resultat</p>
            <p className="text-sm text-muted-foreground">
              Prova en annan plats, typ av tjänst eller prisintervall.
            </p>
          </div>
        ) : (
          /*
            Live --svc-grid_columns: 2 → 3 → 4 → 5
            column-gap 16 → 24 → 32 · row-gap 24 → 32 → 40
          */
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 min-[667px]:grid-cols-2 min-[744px]:gap-y-8 min-[950px]:grid-cols-3 min-[950px]:gap-x-8 min-[1128px]:grid-cols-4 min-[1128px]:gap-x-6 min-[1128px]:gap-y-8 min-[1440px]:grid-cols-5 min-[1440px]:gap-y-10">
            {filtered.map(provider => (
              <ListingCard
                key={provider.id}
                isLoggedIn={isLoggedIn}
                plannerId={plannerId}
                data={{
                  id: provider.id,
                  title: provider.title,
                  city: provider.city,
                  photos: provider.photos,
                  category_slug: provider.category_slug,
                  category_tags: provider.category_tags,
                  users: provider.users,
                  avgRating: provider.avgRating,
                  reviewCount: provider.reviewCount,
                  price_range_min: provider.price_range_min ?? null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChipMenu({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={onClose} />
      <div className="absolute left-1/2 top-10 z-50 min-w-[200px] -translate-x-1/2 rounded-2xl border border-border bg-background py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
        {children}
      </div>
    </>
  )
}

function ChipMenuItem({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto w-full justify-start rounded-none px-4 py-2 text-[13px]',
        active ? 'font-semibold' : 'font-medium'
      )}
    >
      {label}
    </Button>
  )
}
