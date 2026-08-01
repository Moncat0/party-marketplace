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
import { formatOccasion, isOccasionSlug } from '@/lib/occasions'
import { track } from '@/lib/posthog'
import { cn } from '@/lib/utils'

type Provider = {
  id: string
  title: string | null
  city: string | null
  location_id?: string | null
  can_travel?: boolean
  photos: string[]
  category_slug?: string | null
  category_tags: string[]
  occasions?: string[]
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
  initialOccasion: string | null
  initialQuery: string
  initialSort: string
  initialCanTravelOnly?: boolean
  initialReviewFilter?: string
}

type SortKey = 'relevant' | 'rating' | 'price_asc' | 'price_desc'
type ReviewFilter = 'any' | 'reviewed' | '4' | '4.5'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevant', label: 'Relevans' },
  { key: 'rating', label: 'Högst betyg' },
  { key: 'price_asc', label: 'Lägsta pris' },
  { key: 'price_desc', label: 'Högsta pris' },
]

const REVIEW_FILTER_OPTIONS: { key: ReviewFilter; label: string }[] = [
  { key: 'any', label: 'Alla' },
  { key: 'reviewed', label: 'Med omdömen' },
  { key: '4', label: '4,0+ ★' },
  { key: '4.5', label: '4,5+ ★' },
]

function parseReviewFilter(value: string | undefined): ReviewFilter {
  if (value === 'reviewed' || value === '4' || value === '4.5') return value
  return 'any'
}

function matchesReviewFilter(p: Provider, filter: ReviewFilter): boolean {
  if (filter === 'any') return true
  if (filter === 'reviewed') return p.reviewCount > 0
  if (filter === '4') return p.avgRating != null && p.avgRating >= 4 && p.reviewCount > 0
  if (filter === '4.5') return p.avgRating != null && p.avgRating >= 4.5 && p.reviewCount > 0
  return true
}

export default function SearchResults({
  providers,
  isLoggedIn,
  plannerId,
  initialLocationId,
  initialCategory,
  initialOccasion,
  initialQuery,
  initialSort,
  initialCanTravelOnly = false,
  initialReviewFilter,
}: Props) {
  const router = useRouter()
  const [locationId, setLocationId] = useState(initialLocationId)
  const [category, setCategory] = useState<string | null>(initialCategory)
  const [occasion, setOccasion] = useState<string | null>(
    initialOccasion && isOccasionSlug(initialOccasion) ? initialOccasion : null
  )
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortKey>(
    (['relevant', 'rating', 'price_asc', 'price_desc'].includes(initialSort)
      ? initialSort
      : 'relevant') as SortKey
  )
  const [canTravelOnly, setCanTravelOnly] = useState(initialCanTravelOnly)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(
    parseReviewFilter(initialReviewFilter)
  )
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [orderMenuOpen, setOrderMenuOpen] = useState(false)
  const [reviewMenuOpen, setReviewMenuOpen] = useState(false)
  const [editingSearch, setEditingSearch] = useState(false)
  const [editSegment, setEditSegment] = useState<'where' | 'service' | null>(null)
  const [draftPriceMin, setDraftPriceMin] = useState('')
  const [draftPriceMax, setDraftPriceMax] = useState('')
  const [draftCanTravelOnly, setDraftCanTravelOnly] = useState(initialCanTravelOnly)
  const [draftReviewFilter, setDraftReviewFilter] = useState<ReviewFilter>(
    parseReviewFilter(initialReviewFilter)
  )
  const tracked = useRef(false)
  const editRootRef = useRef<HTMLDivElement>(null)

  function expandSearch(segment: 'where' | 'service') {
    setCategoryMenuOpen(false)
    setOrderMenuOpen(false)
    setReviewMenuOpen(false)
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
    setOccasion(
      initialOccasion && isOccasionSlug(initialOccasion) ? initialOccasion : null
    )
    setQuery(initialQuery)
    setCanTravelOnly(initialCanTravelOnly)
    setReviewFilter(parseReviewFilter(initialReviewFilter))
  }, [
    initialLocationId,
    initialCategory,
    initialOccasion,
    initialQuery,
    initialCanTravelOnly,
    initialReviewFilter,
  ])

  const { local, travelers, totalCount } = useMemo(() => {
    let list = [...providers]

    if (category) {
      list = list.filter(
        p =>
          resolveCategorySlug({
            category_slug: p.category_slug,
            category_tags: p.category_tags,
          }) === category
      )
    }

    if (occasion) {
      list = list.filter(p => (p.occasions ?? []).includes(occasion))
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

    if (canTravelOnly) {
      list = list.filter(p => !!p.can_travel)
    }

    if (reviewFilter !== 'any') {
      list = list.filter(p => matchesReviewFilter(p, reviewFilter))
    }

    function sortList(rows: Provider[]) {
      const next = [...rows]
      if (sort === 'rating') {
        next.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      } else if (sort === 'price_asc') {
        next.sort((a, b) => (a.price_range_min ?? 1e9) - (b.price_range_min ?? 1e9))
      } else if (sort === 'price_desc') {
        next.sort((a, b) => (b.price_range_min ?? 0) - (a.price_range_min ?? 0))
      }
      return next
    }

    if (!locationId) {
      const all = sortList(list)
      return { local: all, travelers: [] as Provider[], totalCount: all.length }
    }

    const localRows: Provider[] = []
    const travelerRows: Provider[] = []
    for (const p of list) {
      const id = p.location_id ?? locationIdFromCity(p.city)
      if (id === locationId) {
        localRows.push(p)
      } else if (p.can_travel) {
        travelerRows.push(p)
      }
    }

    const localSorted = sortList(localRows)
    const travelersSorted = sortList(travelerRows)
    return {
      local: localSorted,
      travelers: travelersSorted,
      totalCount: localSorted.length + travelersSorted.length,
    }
  }, [
    providers,
    locationId,
    category,
    occasion,
    query,
    sort,
    priceMin,
    priceMax,
    canTravelOnly,
    reviewFilter,
  ])

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('search_performed', {
      query,
      city: locationId,
      category,
      occasion,
      results_count: totalCount,
      local_count: local.length,
      travelers_count: travelers.length,
      can_travel_only: canTravelOnly,
      review_filter: reviewFilter,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pushSearch(next?: {
    locationId?: string
    category?: string | null
    occasion?: string | null
    query?: string
    sort?: SortKey
    canTravelOnly?: boolean
    reviewFilter?: ReviewFilter
  }) {
    const loc = next?.locationId ?? locationId
    const cat = next?.category === undefined ? category : next.category
    const occ = next?.occasion === undefined ? occasion : next.occasion
    const q = next?.query ?? query
    const s = next?.sort ?? sort
    const travel = next?.canTravelOnly ?? canTravelOnly
    const rating = next?.reviewFilter ?? reviewFilter
    const params = new URLSearchParams()
    if (loc) params.set('location', loc)
    if (cat) params.set('category', cat)
    if (occ) params.set('occasion', occ)
    if (q.trim()) params.set('q', q.trim())
    if (s && s !== 'relevant') params.set('sort', s)
    if (travel) params.set('travel', '1')
    if (rating !== 'any') params.set('rating', rating)
    router.push(`/sok?${params.toString()}`)
  }

  function openFilters() {
    setDraftPriceMin(priceMin)
    setDraftPriceMax(priceMax)
    setDraftCanTravelOnly(canTravelOnly)
    setDraftReviewFilter(reviewFilter)
    setCategoryMenuOpen(false)
    setOrderMenuOpen(false)
    setReviewMenuOpen(false)
    setFiltersOpen(true)
  }

  function applyFilters() {
    setPriceMin(draftPriceMin)
    setPriceMax(draftPriceMax)
    setCanTravelOnly(draftCanTravelOnly)
    setReviewFilter(draftReviewFilter)
    setFiltersOpen(false)
    pushSearch({
      canTravelOnly: draftCanTravelOnly,
      reviewFilter: draftReviewFilter,
    })
  }

  function clearAllFilters() {
    setDraftPriceMin('')
    setDraftPriceMax('')
    setDraftCanTravelOnly(false)
    setDraftReviewFilter('any')
    setPriceMin('')
    setPriceMax('')
    setCanTravelOnly(false)
    setReviewFilter('any')
    setFiltersOpen(false)
    pushSearch({ canTravelOnly: false, reviewFilter: 'any' })
  }

  const catMeta = category ? getCategoryBySlug(category) : null
  const locationLabel = getLocationLabel(locationId || DEFAULT_LOCATION_ID)
  const occasionLabel = occasion ? formatOccasion(occasion) : null
  const serviceLabel = catMeta?.chipLabel ?? catMeta?.label ?? 'All services'
  const headingNoun = catMeta
    ? `${catMeta.chipLabel ?? catMeta.label}`.toLowerCase()
    : 'tjänster'
  const priceFilterActive = !!priceMin || !!priceMax
  const reviewFilterActive = reviewFilter !== 'any'
  const dialogFilterCount =
    (priceFilterActive ? 1 : 0) + (canTravelOnly ? 1 : 0) + (reviewFilterActive ? 1 : 0)
  const reviewChipLabel =
    REVIEW_FILTER_OPTIONS.find(o => o.key === reviewFilter)?.label ?? 'Omdömen'
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
              'flex w-full max-w-full items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide md:w-max md:flex-wrap md:justify-center md:overflow-visible',
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
                dialogFilterCount > 0
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
              {dialogFilterCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                  {dialogFilterCount}
                </span>
              )}
            </Button>

            <div className="mx-0.5 h-5 w-px flex-shrink-0 bg-border" aria-hidden />

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const next = !canTravelOnly
                setCanTravelOnly(next)
                setCategoryMenuOpen(false)
                setOrderMenuOpen(false)
                setReviewMenuOpen(false)
                setFiltersOpen(false)
                pushSearch({ canTravelOnly: next })
              }}
              className={cn(
                'h-9 flex-shrink-0 rounded-full border px-3.5 text-[13px] font-medium shadow-none',
                canTravelOnly
                  ? 'border-foreground bg-background'
                  : 'border-border hover:border-foreground'
              )}
            >
              Kan resa
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReviewMenuOpen(v => !v)
                  setCategoryMenuOpen(false)
                  setOrderMenuOpen(false)
                  setFiltersOpen(false)
                }}
                className={cn(
                  'h-9 flex-shrink-0 gap-1.5 rounded-full border px-3.5 text-[13px] font-medium shadow-none',
                  reviewFilterActive || reviewMenuOpen
                    ? 'border-foreground bg-background'
                    : 'border-border hover:border-foreground'
                )}
              >
                {reviewFilterActive ? reviewChipLabel : 'Omdömen'}
                <ChevronDown />
              </Button>
              {reviewMenuOpen && (
                <ChipMenu onClose={() => setReviewMenuOpen(false)}>
                  {REVIEW_FILTER_OPTIONS.map(o => (
                    <ChipMenuItem
                      key={o.key}
                      label={o.label}
                      active={reviewFilter === o.key}
                      onClick={() => {
                        setReviewFilter(o.key)
                        setReviewMenuOpen(false)
                        pushSearch({ reviewFilter: o.key })
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
                  setCategoryMenuOpen(v => !v)
                  setOrderMenuOpen(false)
                  setReviewMenuOpen(false)
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
                  setReviewMenuOpen(false)
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

          <div className="flex flex-col gap-8 px-6 py-6">
            <div className="flex flex-col gap-3">
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

            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold text-foreground">Kan resa</h3>
              <p className="text-[14px] text-muted-foreground">
                Visa bara talanger som kan resa till dig.
              </p>
              <button
                type="button"
                onClick={() => setDraftCanTravelOnly(v => !v)}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors',
                  draftCanTravelOnly
                    ? 'border-foreground bg-muted/40'
                    : 'border-border hover:border-foreground'
                )}
              >
                <span className="text-[15px] font-medium text-foreground">Endast kan resa</span>
                <span
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    draftCanTravelOnly ? 'bg-foreground' : 'bg-border'
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform',
                      draftCanTravelOnly ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold text-foreground">Omdömen</h3>
              <p className="text-[14px] text-muted-foreground">
                Filtrera på betyg och antal omdömen.
              </p>
              <div className="flex flex-wrap gap-2">
                {REVIEW_FILTER_OPTIONS.map(o => (
                  <Button
                    key={o.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDraftReviewFilter(o.key)}
                    className={cn(
                      'h-9 rounded-full border px-3.5 text-[13px] font-medium shadow-none',
                      draftReviewFilter === o.key
                        ? 'border-foreground bg-background'
                        : 'border-border hover:border-foreground'
                    )}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="link"
              onClick={clearAllFilters}
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
          Utforska {totalCount} {headingNoun}
          {occasionLabel ? ` till ${occasionLabel.toLowerCase()}` : ''}
          {locationId ? ` i ${locationLabel}` : ''}
        </h1>

        {totalCount === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-4 text-4xl">🎭</p>
            <p className="mb-2 text-lg font-semibold text-foreground">Inga resultat</p>
            <p className="text-sm text-muted-foreground">
              Prova en annan plats, typ av tjänst eller prisintervall.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {locationId && local.length === 0 && travelers.length > 0 ? (
              <p className="text-[14px] text-muted-foreground">
                Inga lokala träffar i {locationLabel} — här är talanger som kan resa hit.
              </p>
            ) : null}

            {local.length > 0 && (
              <section>
                {locationId && travelers.length > 0 ? (
                  <h2 className="mb-5 text-[16px] font-semibold text-foreground md:text-[18px]">
                    Lokalt i {locationLabel}
                  </h2>
                ) : null}
                <ResultsGrid
                  providers={local}
                  isLoggedIn={isLoggedIn}
                  plannerId={plannerId}
                />
              </section>
            )}

            {locationId && travelers.length > 0 ? (
              <section>
                <div className="mb-5">
                  <h2 className="text-[16px] font-semibold text-foreground md:text-[18px]">
                    Kan resa hit
                  </h2>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    Talanger från andra städer som kan komma till {locationLabel}.
                  </p>
                </div>
                <ResultsGrid
                  providers={travelers}
                  isLoggedIn={isLoggedIn}
                  plannerId={plannerId}
                />
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultsGrid({
  providers,
  isLoggedIn,
  plannerId,
}: {
  providers: Provider[]
  isLoggedIn: boolean
  plannerId: string | null
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 min-[667px]:grid-cols-2 min-[744px]:gap-y-8 min-[950px]:grid-cols-3 min-[950px]:gap-x-8 min-[1128px]:grid-cols-4 min-[1128px]:gap-x-6 min-[1128px]:gap-y-8 min-[1440px]:grid-cols-5 min-[1440px]:gap-y-10">
      {providers.map(provider => (
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
