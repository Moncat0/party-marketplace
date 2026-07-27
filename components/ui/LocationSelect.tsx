'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getActiveLocations, getLocationLabel, LOCATIONS, type Location } from '@/lib/locations'
import { cn } from '@/lib/utils'

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
        <label htmlFor={id} className="block text-[14px] font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-col gap-2">
        {active.map(loc => {
          const selected = value === loc.id
          return (
            <Button
              key={loc.id}
              type="button"
              variant="outline"
              id={selected ? id : undefined}
              onClick={() => onChange(loc.id)}
              className={cn(
                'h-14 w-full justify-between rounded-xl px-4 text-left text-[16px]',
                selected && 'border-foreground bg-accent font-semibold'
              )}
            >
              <span>{loc.label}</span>
              {selected && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path
                    d="M3.5 9.5l3.5 3.5 7.5-8"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </Button>
          )
        })}
      </div>
      {showComingSoon && comingSoon.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Kommer snart
          </p>
          <div className="flex flex-col gap-2">
            {comingSoon.map(loc => (
              <div
                key={loc.id}
                className="w-full flex items-center justify-between px-4 h-12 text-[15px] rounded-xl border border-border text-muted-foreground/60 cursor-not-allowed"
              >
                <span>{loc.label}</span>
                <Badge variant="outline" className="text-[12px] font-normal text-muted-foreground/60">
                  Snart
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="sr-only">Vald plats: {getLocationLabel(value)}</p>
    </div>
  )
}
