'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  /**
   * Earliest selectable day. Omit to default to today (booking).
   * Pass `null` for no lower bound (e.g. date of birth).
   */
  minDate?: Date | null
  /** Latest selectable day. Omit / null = no upper bound. */
  maxDate?: Date | null
  /** When empty, open the calendar on this month (e.g. ~25 years ago for DOB). */
  defaultViewDate?: Date
  className?: string
  triggerClassName?: string
  dialogLabel?: string
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Lägg till datum',
  minDate,
  maxDate = null,
  defaultViewDate,
  className,
  triggerClassName,
  dialogLabel = 'Välj datum',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const selected = parseISODate(value)
  const today = startOfDay(new Date())
  const min = minDate === null ? null : startOfDay(minDate ?? today)
  const max = maxDate == null ? null : startOfDay(maxDate)

  const [view, setView] = useState(() => {
    const base =
      selected ??
      defaultViewDate ??
      (minDate === null
        ? new Date(today.getFullYear() - 25, today.getMonth(), 1)
        : today)
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(
    null
  )

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
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
    } else if (open && !selected && defaultViewDate) {
      setView(new Date(defaultViewDate.getFullYear(), defaultViewDate.getMonth(), 1))
    }
  }, [open, selected, defaultViewDate])

  useLayoutEffect(() => {
    if (!open) {
      setBox(null)
      return
    }
    function update() {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = Math.max(rect.width, 300)
      let left = rect.left
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8)
      }
      setBox({
        top: rect.bottom + 8,
        left,
        width,
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, view])

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const viewStart = new Date(year, month, 1)
  const viewEnd = new Date(year, month + 1, 0)
  const canGoPrev = !min || viewStart > min
  const canGoNext = !max || viewEnd < max

  const popover =
    open && box && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={dialogLabel}
            className="z-[220] bg-white p-4"
            style={{
              position: 'fixed',
              top: box.top,
              left: box.left,
              width: box.width,
              borderRadius: 16,
              border: '1px solid rgba(221,221,221,1)',
              boxShadow: 'rgba(0, 0, 0, 0.2) 0px 8px 28px',
            }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-0.5">
                {minDate === null ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canGoPrev}
                    onClick={() => setView(new Date(year - 1, month, 1))}
                    className="size-8 rounded-full"
                    aria-label="Föregående år"
                  >
                    <span className="text-[11px] font-semibold">«</span>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canGoPrev}
                  onClick={() => setView(new Date(year, month - 1, 1))}
                  className="size-8 rounded-full"
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
                </Button>
              </div>
              <span className="text-[16px] font-semibold text-foreground capitalize">
                {MONTHS[month]} {year}
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canGoNext}
                  onClick={() => setView(new Date(year, month + 1, 1))}
                  className="size-8 rounded-full"
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
                </Button>
                {minDate === null ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canGoNext}
                    onClick={() => setView(new Date(year + 1, month, 1))}
                    className="size-8 rounded-full"
                    aria-label="Nästa år"
                  >
                    <span className="text-[11px] font-semibold">»</span>
                  </Button>
                ) : null}
              </div>
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
                const dayStart = startOfDay(date)
                const disabled =
                  (min != null && dayStart < min) || (max != null && dayStart > max)
                const isSelected = value === iso
                const isToday = toISODate(today) === iso

                return (
                  <div key={iso} className="h-10 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => {
                        onChange(iso)
                        setOpen(false)
                      }}
                      className={cn(
                        'size-10 rounded-full p-0 text-[14px]',
                        disabled &&
                          'text-muted-foreground/40 cursor-not-allowed hover:bg-transparent',
                        isSelected &&
                          'bg-foreground text-background font-semibold hover:bg-foreground hover:text-background',
                        !disabled &&
                          !isSelected &&
                          isToday &&
                          'font-semibold ring-1 ring-foreground',
                        !disabled && !isSelected && !isToday && 'text-foreground'
                      )}
                    >
                      {day}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'h-auto w-full flex-col items-start justify-center gap-0.5 whitespace-normal px-3 py-2.5 text-left focus-visible:ring-inset focus-visible:ring-foreground',
          triggerClassName
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wide leading-none">
          {label}
        </span>
        <span
          className={cn(
            'text-[14px] leading-5 font-normal',
            value ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {formatDisplay(value) ?? placeholder}
        </span>
      </Button>
      {popover}
    </div>
  )
}
