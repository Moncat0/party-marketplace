'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

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

/**
 * Date field — Popover + Calendar (shadcn). Booking defaults to today+;
 * DOB uses dropdown years (`minDate={null}`).
 */
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
  const selected = parseISODate(value)
  const today = useMemo(() => startOfDay(new Date()), [])
  const min = minDate === null ? null : startOfDay(minDate ?? today)
  const max = maxDate == null ? null : startOfDay(maxDate)
  const isDob = minDate === null

  const defaultMonth = useMemo(() => {
    if (selected) return selected
    if (defaultViewDate) return defaultViewDate
    if (isDob) return new Date(today.getFullYear() - 25, today.getMonth(), 1)
    return today
  }, [selected, defaultViewDate, isDob, today])

  const startMonth = isDob
    ? new Date(today.getFullYear() - 120, 0, 1)
    : min ?? undefined
  const endMonth = max
    ? new Date(max.getFullYear(), max.getMonth(), 1)
    : isDob
      ? today
      : new Date(today.getFullYear() + 3, 11, 1)

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label={dialogLabel}
            className={cn(
              'h-auto w-full flex-col items-start justify-center gap-0.5 whitespace-normal px-3 py-2.5 text-left focus-visible:ring-inset focus-visible:ring-foreground',
              triggerClassName
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide leading-none text-foreground">
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
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-[220] w-auto border-border p-0 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            defaultMonth={defaultMonth}
            captionLayout={isDob ? 'dropdown' : 'label'}
            startMonth={startMonth}
            endMonth={endMonth}
            disabled={date => {
              const day = startOfDay(date)
              if (min && day < min) return true
              if (max && day > max) return true
              return false
            }}
            onSelect={date => {
              if (!date) return
              onChange(toISODate(date))
              setOpen(false)
            }}
            className="rounded-2xl"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
