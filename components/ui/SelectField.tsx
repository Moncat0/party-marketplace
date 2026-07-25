'use client'

import { useEffect, useRef, useState } from 'react'

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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 py-2.5 pr-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#222222]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="block text-[10px] font-bold text-[#222222] uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`block text-[14px] mt-0.5 ${
            selected ? 'text-[#222222]' : 'text-[#717171]'
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#222222] pointer-events-none">
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
      </button>

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
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={[
                    'w-full text-left px-4 py-3 text-[14px] transition-colors',
                    active
                      ? 'bg-[#f7f7f7] font-semibold text-[#222222]'
                      : 'text-[#222222] hover:bg-[#f7f7f7]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
