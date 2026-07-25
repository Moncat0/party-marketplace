'use client'

import { useEffect, useRef, useState } from 'react'
import Search from '@/components/navbar/Search'
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
}

/**
 * Homepage search — big pill at rest, little-search on scroll.
 */
export default function BrowseSearch({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
  locationId,
  onLocationChange,
  scrolled = false,
}: Props) {
  const [open, setOpen] = useState<'where' | 'category' | 'query' | null>(null)
  const [draft, setDraft] = useState(query)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const compact = scrolled

  useEffect(() => setDraft(query), [query])

  useEffect(() => {
    if (scrolled) setOpen(null)
  }, [scrolled])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open === 'query') inputRef.current?.focus()
  }, [open])

  const category = CATEGORIES.find(c => c.slug === activeCategory)
  const locationLabel = getLocationLabel(locationId)
  const categoryLabel = category?.label ?? (compact ? 'Alla' : 'Välj kategori')
  const queryLabel = query.trim() || 'Sök talang'

  function applyQuery() {
    onQueryChange(draft.trim())
    setOpen(null)
  }

  return (
    <div ref={rootRef} className="relative w-full flex justify-center">
      <div className="md:hidden w-full max-w-md">
        <div className="relative">
          <svg
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6A6A6A] pointer-events-none"
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
            onChange={e => {
              setDraft(e.target.value)
              onQueryChange(e.target.value)
            }}
            placeholder="Sök DJ, fotograf, sångare..."
            className="w-full h-[48px] rounded-[32px] bg-[#EBEBEB] pl-12 pr-5 text-sm font-medium text-[#222222] placeholder-[#6A6A6A] border-0 focus:outline-none focus:ring-2 focus:ring-[#222222]/10"
          />
        </div>
      </div>

      <Search
        compact={compact}
        locationTitle="Var"
        dateTitle="Typ"
        guestTitle="Sök"
        locationLabel={locationLabel}
        dateLabel={categoryLabel}
        guestLabel={queryLabel}
        onLocationClick={() => setOpen(o => (o === 'where' ? null : 'where'))}
        onDateClick={() => setOpen(o => (o === 'category' ? null : 'category'))}
        onGuestClick={() => setOpen(o => (o === 'query' ? null : 'query'))}
        onSearch={applyQuery}
      />

      {open === 'where' && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-3 w-[min(100vw-2rem,360px)] bg-white py-2"
          style={{
            borderRadius: 24,
            border: '1px solid rgba(221,221,221,1)',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 8px 28px',
          }}
        >
          <p className="px-5 pt-2 pb-1 text-[12px] font-semibold text-[#6a6a6a] uppercase tracking-wide">
            Var ska eventet vara?
          </p>
          {getActiveLocations().map(loc => (
            <button
              key={loc.id}
              type="button"
              onClick={() => {
                onLocationChange(loc.id)
                setOpen(null)
              }}
              className={`w-full text-left px-5 py-3 text-[15px] hover:bg-[#f7f7f7] ${
                locationId === loc.id ? 'font-semibold text-[#222]' : 'text-[#222]'
              }`}
            >
              {loc.label}
            </button>
          ))}
          {LOCATIONS.some(l => !l.active) && (
            <>
              <div className="my-1 border-t border-[#ebebeb]" />
              <p className="px-5 pt-2 pb-1 text-[12px] font-semibold text-[#6a6a6a] uppercase tracking-wide">
                Kommer snart
              </p>
              {LOCATIONS.filter(l => !l.active).map(loc => (
                <div
                  key={loc.id}
                  className="w-full px-5 py-3 text-[15px] text-[#b0b0b0] flex justify-between"
                >
                  <span>{loc.label}</span>
                  <span className="text-[12px]">Snart</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {open === 'category' && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-3 w-[min(100vw-2rem,360px)] bg-white py-2"
          style={{
            borderRadius: 24,
            border: '1px solid rgba(221,221,221,1)',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 8px 28px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onCategoryChange(null)
              setOpen(null)
            }}
            className={`w-full text-left px-5 py-3 text-[15px] hover:bg-[#f7f7f7] ${
              !activeCategory ? 'font-semibold text-[#222]' : 'text-[#222]'
            }`}
          >
            Alla kategorier
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                onCategoryChange(c.slug)
                setOpen(null)
              }}
              className={`w-full text-left px-5 py-3 text-[15px] hover:bg-[#f7f7f7] flex items-center gap-3 ${
                activeCategory === c.slug ? 'font-semibold text-[#222]' : 'text-[#222]'
              }`}
            >
              <span aria-hidden>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {open === 'query' && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-3 w-[min(100vw-2rem,420px)] bg-white p-4"
          style={{
            borderRadius: 24,
            border: '1px solid rgba(221,221,221,1)',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 8px 28px',
          }}
        >
          <label className="block text-[12px] font-semibold text-[#222] mb-2">Sök talang</label>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') applyQuery()
            }}
            placeholder="DJ, fotograf, sångare..."
            className="w-full h-12 px-4 text-[15px] border border-[#b0b0b0] rounded-xl focus:outline-none focus:border-[#222] focus:ring-1 focus:ring-[#222]"
          />
          <button
            type="button"
            onClick={applyQuery}
            className="mt-3 w-full h-11 text-[15px] font-semibold text-white bg-[#FF6B35] hover:bg-[#e55a26] rounded-xl"
          >
            Sök
          </button>
        </div>
      )}
    </div>
  )
}
