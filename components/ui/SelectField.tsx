'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SelectOption = {
  value: string
  label: string
}

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Välj...',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

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

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        className="relative h-auto w-full flex-col items-start justify-center gap-0.5 whitespace-normal px-3 py-2.5 pr-9 text-left focus-visible:ring-inset focus-visible:ring-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wide leading-none">
          {label}
        </span>
        <span
          className={cn(
            'text-[14px] leading-5 font-normal',
            selected ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground pointer-events-none">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 py-2 bg-white overflow-hidden"
          style={{
            borderRadius: 12,
            border: '1px solid rgba(221,221,221,1)',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 8px 28px',
          }}
        >
          {options.map(opt => {
            const active = opt.value === value
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'h-auto w-full justify-start rounded-none px-4 py-3 text-[14px]',
                    active && 'bg-accent font-semibold text-foreground'
                  )}
                >
                  {opt.label}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
