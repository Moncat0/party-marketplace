'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Search, { type SearchSegment } from '@/components/navbar/Search'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/categories'
import {
  getActiveLocations,
  getLocationLabel,
  LOCATIONS,
} from '@/lib/locations'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  activeCategory: string | null
  onCategoryChange: (slug: string | null) => void
  locationId: string
  onLocationChange: (id: string) => void
  /** Shrink to little-search when header is scrolled. */
  scrolled?: boolean
  /**
   * Results-page edit mode: stay on the denser bar (no homepage-scale pill).
   * Opens the where/service panel immediately.
   */
  resultsEdit?: boolean
  initialOpen?: 'where' | 'service' | null
  /**
   * Called when the user clicks Sök. If omitted, navigates to `/sok` with params.
   */
  onSubmitSearch?: (params: {
    locationId: string
    category: string | null
    query: string
  }) => void
}

/**
 * Homepage / results search — Var + Typ av tjänst.
 * Navigates automatically once both destination and service are chosen.
 */
export default function BrowseSearch({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
  locationId,
  onLocationChange,
  scrolled = false,
  resultsEdit = false,
  initialOpen = null,
  onSubmitSearch,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<SearchSegment | null>(initialOpen)
  const [draft, setDraft] = useState(query)
  const rootRef = useRef<HTMLDivElement>(null)
  const whereInputRef = useRef<HTMLInputElement>(null)

  // Results page stays on the little bar; homepage can expand when focused.
  const compact = scrolled || resultsEdit

  useEffect(() => setDraft(query), [query])

  useEffect(() => {
    if (scrolled && !resultsEdit) setOpen(null)
  }, [scrolled, resultsEdit])

  useEffect(() => {
    if (initialOpen) setOpen(initialOpen)
  }, [initialOpen])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open === 'where') whereInputRef.current?.focus()
  }, [open])

  const category = CATEGORIES.find(c => c.slug === activeCategory)
  const hasLocation = !!locationId
  const locationLabel = hasLocation
    ? resultsEdit
      ? `Services in ${getLocationLabel(locationId)}`
      : getLocationLabel(locationId)
    : resultsEdit
      ? 'Services nearby'
      : 'Sök destinationer'
  const serviceLabel = category?.chipLabel ?? category?.label ?? (resultsEdit ? 'All services' : 'Lägg till tjänst')

  const locationSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase()
    const active = getActiveLocations()
    const soon = LOCATIONS.filter(l => !l.active)
    if (!q) return { active, soon }
    return {
      active: active.filter(l => l.label.toLowerCase().includes(q)),
      soon: soon.filter(l => l.label.toLowerCase().includes(q)),
    }
  }, [draft])

  function toggle(segment: SearchSegment) {
    setOpen(o => (o === segment ? null : segment))
  }

  function applySearchWith(next: { locationId: string; category: string | null }) {
    const q = draft.trim()
    onQueryChange(q)
    setOpen(null)
    const params = { locationId: next.locationId, category: next.category, query: q }
    if (onSubmitSearch) {
      onSubmitSearch(params)
      return
    }
    const sp = new URLSearchParams()
    if (next.locationId) sp.set('location', next.locationId)
    if (next.category) sp.set('category', next.category)
    if (q) sp.set('q', q)
    router.push(`/sok?${sp.toString()}`)
  }

  function applySearch() {
    applySearchWith({ locationId, category: activeCategory })
  }

  function selectLocation(id: string) {
    onLocationChange(id)
    setDraft('')
    if (activeCategory) {
      applySearchWith({ locationId: id, category: activeCategory })
    } else {
      setOpen('service')
    }
  }

  function selectService(slug: string | null) {
    onCategoryChange(slug)
    if (locationId) {
      applySearchWith({ locationId, category: slug })
    } else {
      setOpen('where')
    }
  }

  return (
    <div ref={rootRef} className="relative w-full flex justify-center">
      {/* Mobile: simple search */}
      <div className="md:hidden w-full max-w-md">
        <div className="relative">
          <svg
            className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') applySearch()
            }}
            placeholder="Sök DJ, fotograf, sångare..."
            className="w-full h-[48px] rounded-[32px] bg-muted pl-12 pr-5 text-sm font-medium text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
      </div>

      <Search
        compact={compact}
        active={open}
        locationTitle="Var"
        serviceTitle="Tjänst"
        locationLabel={locationLabel}
        serviceLabel={serviceLabel}
        hasLocationValue={hasLocation}
        hasServiceValue={!!activeCategory}
        onLocationClick={() => toggle('where')}
        onServiceClick={() => toggle('service')}
        onSearch={applySearch}
        onClearLocation={() => onLocationChange('')}
        onClearService={() => onCategoryChange(null)}
        maxWidth={resultsEdit ? 380 : undefined}
      />

      {/* ── Where panel ── */}
      {open === 'where' && (
        <Panel className="left-0 w-[min(100vw-2rem,420px)]">
          <div className="px-6 pt-5 pb-3">
            <input
              ref={whereInputRef}
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Sök destinationer"
              className="w-full h-12 px-4 text-[15px] text-foreground placeholder:text-muted-foreground border border-input rounded-xl focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
            />
          </div>
          <p className="px-6 pb-2 text-[12px] font-semibold text-foreground">Föreslagna destinationer</p>
          <ul className="pb-4">
            {locationSuggestions.active.map(loc => (
              <li key={loc.id}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => selectLocation(loc.id)}
                  className="w-full justify-start gap-4 px-6 py-3 h-auto rounded-none"
                >
                  <PinIcon />
                  <span className="text-[15px] text-foreground">
                    <span className="font-semibold">{loc.label}</span>
                    <span className="text-muted-foreground">, Sverige</span>
                  </span>
                </Button>
              </li>
            ))}
            {locationSuggestions.soon.map(loc => (
              <li key={loc.id}>
                <div className="w-full flex items-center gap-4 px-6 py-3 opacity-50">
                  <PinIcon />
                  <span className="text-[15px] text-foreground flex-1">
                    <span className="font-semibold">{loc.label}</span>
                    <span className="text-muted-foreground">, Sverige</span>
                  </span>
                  <span className="text-[12px] text-muted-foreground">Snart</span>
                </div>
              </li>
            ))}
            {locationSuggestions.active.length === 0 && locationSuggestions.soon.length === 0 && (
              <li className="px-6 py-4 text-[14px] text-muted-foreground">Inga destinationer matchade</li>
            )}
          </ul>
        </Panel>
      )}

      {/* ── Type of service panel (Airbnb Services chip grid) ── */}
      {open === 'service' && (
        <Panel className="right-0 w-[min(100vw-2rem,560px)]">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ServiceChip
                label="Alla"
                icon={<ServiceIcon kind="all" />}
                active={!activeCategory}
                onClick={() => selectService(null)}
              />
              {CATEGORIES.map(c => (
                <ServiceChip
                  key={c.slug}
                  label={c.chipLabel ?? c.label}
                  icon={<ServiceIcon kind={c.slug} />}
                  active={activeCategory === c.slug}
                  onClick={() => selectService(c.slug)}
                />
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`absolute top-full z-[60] mt-3 bg-background overflow-hidden ${className}`}
      style={{
        borderRadius: 32,
        boxShadow: '0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </div>
  )
}

function PinIcon() {
  return (
    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    </span>
  )
}

function ServiceChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        'h-auto min-h-[52px] w-full justify-start gap-2.5 rounded-full border px-4 py-3 text-left shadow-none',
        active
          ? 'border-foreground bg-background hover:bg-background'
          : 'border-[#dddddd] bg-background hover:border-foreground'
      )}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-foreground" aria-hidden>
        {icon}
      </span>
      <span className="truncate text-[13px] font-medium leading-tight text-foreground">{label}</span>
    </Button>
  )
}

/** Airbnb-style line icons for service chips */
function ServiceIcon({ kind }: { kind: string }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (kind) {
    case 'all':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'dj':
      return (
        <svg {...props}>
          <path d="M3 14v3a2 2 0 0 0 2 2h1" />
          <path d="M21 14v3a2 2 0 0 1-2 2h-1" />
          <circle cx="7.5" cy="11.5" r="3.5" />
          <circle cx="16.5" cy="11.5" r="3.5" />
          <path d="M11 11.5h2" />
        </svg>
      )
    case 'fotograf':
      return (
        <svg {...props}>
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
          <circle cx="12" cy="13.5" r="3.5" />
        </svg>
      )
    case 'musik':
      return (
        <svg {...props}>
          <path d="M9 18V6l12-2v12" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    case 'makeup':
      return (
        <svg {...props}>
          <path d="M4 20l8-14 2 2-8 14-2-2z" />
          <path d="M12 6l2-2 4 4-2 2" />
          <path d="M15 9l3 3" />
        </svg>
      )
    case 'underhallning':
      return (
        <svg {...props}>
          <path d="M5 8c0-2 1.5-3.5 3.5-3.5S12 6 12 8v9H5V8z" />
          <path d="M19 8c0-2-1.5-3.5-3.5-3.5S12 6 12 8v9h7V8z" />
          <path d="M8 12h.01M16 12h.01" />
          <path d="M5 17h14" />
        </svg>
      )
    case 'catering':
      return (
        <svg {...props}>
          <path d="M6 14c0-4 2.5-7 6-7s6 3 6 7" />
          <path d="M4 14h16" />
          <path d="M6 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
          <path d="M12 7V4" />
        </svg>
      )
    case 'barnkalas':
      return (
        <svg {...props}>
          <path d="M12 3c-2.5 2.5-4 5-4 7.5a4 4 0 0 0 8 0C16 8 14.5 5.5 12 3z" />
          <path d="M12 15v6" />
          <path d="M9 21h6" />
        </svg>
      )
    case 'brollop':
      return (
        <svg {...props}>
          <circle cx="9" cy="12" r="4" />
          <circle cx="15" cy="12" r="4" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}
