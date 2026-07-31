'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Suggestion = {
  placeId: string
  mainText: string
  secondaryText: string
  description: string
}

export type AddressPlaceValue = {
  address: string
  placeId: string | null
  lat: number | null
  lng: number | null
}

type Props = {
  value: string
  onChange: (next: AddressPlaceValue) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
  /** Accessible name when no visible label wraps the field */
  'aria-label'?: string
}

function newSessionToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * Sweden-biased address field backed by Google Places Autocomplete (New)
 * via /api/places/*. Falls back to plain text if Places is not configured.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Gatuadress, Stockholm',
  className,
  inputClassName,
  disabled,
  'aria-label': ariaLabel = 'Adress',
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef(newSessionToken())
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [placesAvailable, setPlacesAvailable] = useState(true)
  const [activeIndex, setActiveIndex] = useState(-1)
  const skipFetchRef = useRef(false)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }
    if (!placesAvailable || disabled) return

    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q,
          session: sessionRef.current,
        })
        const res = await fetch(`/api/places/autocomplete?${params}`, {
          signal: controller.signal,
        })
        if (res.status === 503) {
          setPlacesAvailable(false)
          setSuggestions([])
          setOpen(false)
          return
        }
        const data = (await res.json()) as {
          suggestions?: Suggestion[]
        }
        const next = data.suggestions ?? []
        setSuggestions(next)
        setOpen(next.length > 0)
        setActiveIndex(-1)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, placesAvailable, disabled])

  async function selectSuggestion(s: Suggestion) {
    setLoading(true)
    setOpen(false)
    setSuggestions([])
    try {
      const params = new URLSearchParams({
        placeId: s.placeId,
        session: sessionRef.current,
      })
      const res = await fetch(`/api/places/details?${params}`)
      const data = (await res.json()) as {
        place?: {
          placeId: string
          formattedAddress: string
          lat: number | null
          lng: number | null
        } | null
      }
      const place = data.place
      const address = place?.formattedAddress ?? s.description
      skipFetchRef.current = true
      setQuery(address)
      onChange({
        address,
        placeId: place?.placeId ?? s.placeId,
        lat: place?.lat ?? null,
        lng: place?.lng ?? null,
      })
      // New session after a completed selection (billed as one Autocomplete session)
      sessionRef.current = newSessionToken()
    } catch {
      skipFetchRef.current = true
      setQuery(s.description)
      onChange({
        address: s.description,
        placeId: s.placeId,
        lat: null,
        lng: null,
      })
      sessionRef.current = newSessionToken()
    } finally {
      setLoading(false)
    }
  }

  function commitFreeText(next: string) {
    onChange({
      address: next,
      placeId: null,
      lat: null,
      lng: null,
    })
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        type="text"
        value={query}
        disabled={disabled}
        autoComplete="street-address"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent text-[14px] text-[#222222] placeholder-[#717171] focus:outline-none',
          inputClassName
        )}
        onChange={e => {
          const next = e.target.value
          setQuery(next)
          commitFreeText(next)
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        onKeyDown={e => {
          if (!open || suggestions.length === 0) {
            if (e.key === 'Escape') setOpen(false)
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(i => (i + 1) % suggestions.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1))
          } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault()
            void selectSuggestion(suggestions[activeIndex])
          } else if (e.key === 'Escape') {
            setOpen(false)
            setActiveIndex(-1)
          }
        }}
      />

      {loading && (
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[11px] text-[#717171]">
          …
        </span>
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-[#dddddd] bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
        >
          {suggestions.map((s, index) => (
            <li key={s.placeId} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[#f7f7f7]',
                  index === activeIndex && 'bg-[#f7f7f7]'
                )}
                onMouseDown={e => e.preventDefault()}
                onClick={() => void selectSuggestion(s)}
              >
                <span className="text-[13px] font-medium text-[#222222]">{s.mainText}</span>
                {s.secondaryText ? (
                  <span className="text-[12px] text-[#6a6a6a]">{s.secondaryText}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
