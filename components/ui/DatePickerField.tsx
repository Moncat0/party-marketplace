'use client'

import { useEffect, useRef, useState } from 'react'

const WEEKDAYS = ['må', 'ti', 'on', 'to', 'fr', 'lö', 'sö']
const MONTHS = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
]

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISODate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatDisplay(value: string) {
  const d = parseISODate(value)
  if (!d) return null
  return d.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

type Props = {
  label: string
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  minDate?: Date
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Lägg till datum',
  minDate,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = parseISODate(value)
  const today = startOfDay(new Date())
  const min = startOfDay(minDate ?? today)

  const [view, setView] = useState(() => {
    const base = selected ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open && selected) {
      setView(new Date(selected.getFullYear(), selected.getMonth(), 1))
    }
  }, [open, selected])

  const year = view.getFullYear()
  const month = view.getMonth()
  // Monday-first grid
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const canGoPrev =
    year > min.getFullYear() || (year === min.getFullYear() && month > min.getMonth())

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#222222]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="block text-[10px] font-bold text-[#222222] uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`block text-[14px] mt-0.5 ${
            value ? 'text-[#222222]' : 'text-[#717171]'
          }`}
        >
          {formatDisplay(value) ?? placeholder}
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 bg-white p-4"
          style={{
            borderRadius: 16,
            border: '1px solid rgba(221,221,221,1)',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 8px 28px',
            minWidth: 300,
          }}
          role="dialog"
          aria-label="Välj datum"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7] disabled:opacity-30 disabled:hover:bg-transparent text-[#222222]"
              aria-label="Föregående månad"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M7.5 2.5L4 6l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-[16px] font-semibold text-[#222222] capitalize">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f7f7] text-[#222222]"
              aria-label="Nästa månad"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M4.5 2.5L8 6l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div
                key={d}
                className="h-9 flex items-center justify-center text-[12px] font-semibold text-[#717171]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day == null) {
                return <div key={`e-${i}`} className="h-10" />
              }
              const date = new Date(year, month, day)
              const iso = toISODate(date)
              const disabled = startOfDay(date) < min
              const isSelected = value === iso
              const isToday = toISODate(today) === iso

              return (
                <div key={iso} className="h-10 flex items-center justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso)
                      setOpen(false)
                    }}
                    className={[
                      'w-10 h-10 rounded-full text-[14px] transition-colors',
                      disabled
                        ? 'text-[#ddd] cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#222222] text-white font-semibold'
                          : isToday
                            ? 'font-semibold text-[#222222] ring-1 ring-[#222222] hover:bg-[#f7f7f7]'
                            : 'text-[#222222] hover:bg-[#f7f7f7]',
                    ].join(' ')}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
