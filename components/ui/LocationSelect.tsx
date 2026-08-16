'use client'

import { getActiveLocations, getLocationLabel } from '@/lib/locations'
import { cn } from '@/lib/utils'

type Props = {
  id?: string
  label?: string
  value: string
  onChange: (locationId: string) => void
  /** @deprecated – all cities are now active, ignored */
  showComingSoon?: boolean
  className?: string
}

/** Controlled city picker — all Swedish cities. */
export default function LocationSelect({
  id = 'location',
  label = 'Stad',
  value,
  onChange,
  className,
}: Props) {
  const cities = getActiveLocations()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[14px] font-medium text-[#222222] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-xl border border-[#b0b0b0] bg-white px-4 py-4 pr-10 text-[16px] text-[#222222]',
            'focus:outline-none focus:ring-2 focus:ring-[#222222]',
            'cursor-pointer'
          )}
        >
          <option value="" disabled>
            Välj stad…
          </option>
          {cities.map(loc => (
            <option key={loc.id} value={loc.id}>
              {loc.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6a6a6a]"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="sr-only">Vald stad: {getLocationLabel(value)}</p>
    </div>
  )
}
