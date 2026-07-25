'use client'

import { getActiveLocations, getLocationLabel, LOCATIONS, type Location } from '@/lib/locations'

type Props = {
  id?: string
  label?: string
  value: string
  onChange: (locationId: string) => void
  /** Show inactive “coming soon” locations as disabled. */
  showComingSoon?: boolean
  allLocations?: Location[]
}

/** Controlled location picker — Stockholm launch, expandable list. */
export default function LocationSelect({
  id = 'location',
  label = 'Plats',
  value,
  onChange,
  showComingSoon = true,
  allLocations,
}: Props) {
  const active = getActiveLocations()
  const comingSoon = (allLocations ?? LOCATIONS).filter(l => !l.active)

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-[14px] font-medium text-[#222222] mb-2">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {active.map(loc => {
          const selected = value === loc.id
          return (
            <button
              key={loc.id}
              type="button"
              id={selected ? id : undefined}
              onClick={() => onChange(loc.id)}
              className={`w-full flex items-center justify-between px-4 h-14 text-left text-[16px] rounded-xl border transition-colors ${
                selected
                  ? 'border-[#222222] bg-[#f7f7f7] font-semibold text-[#222222]'
                  : 'border-[#dddddd] text-[#222222] hover:border-[#b0b0b0]'
              }`}
            >
              <span>{loc.label}</span>
              {selected && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path
                    d="M3.5 9.5l3.5 3.5 7.5-8"
                    stroke="#222"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )
        })}
      </div>
      {showComingSoon && comingSoon.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-[#6a6a6a] uppercase tracking-wide mb-2">
            Kommer snart
          </p>
          <div className="space-y-2">
            {comingSoon.map(loc => (
              <div
                key={loc.id}
                className="w-full flex items-center justify-between px-4 h-12 text-[15px] rounded-xl border border-[#ebebeb] text-[#b0b0b0] cursor-not-allowed"
              >
                <span>{loc.label}</span>
                <span className="text-[12px]">Snart</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="sr-only">Vald plats: {getLocationLabel(value)}</p>
    </div>
  )
}
