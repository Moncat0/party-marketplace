/**
 * Controlled service locations for FESTEN.
 * Launch: Stockholm only. Add more Swedish cities here as we expand.
 */

export type Location = {
  id: string
  label: string
  /** ISO-ish region for future grouping */
  country: 'SE'
  active: boolean
}

export const LOCATIONS: Location[] = [
  {
    id: 'stockholm',
    label: 'Stockholm',
    country: 'SE',
    active: true,
  },
  // Coming soon — keep inactive so UI can show them disabled later
  { id: 'goteborg', label: 'Göteborg', country: 'SE', active: false },
  { id: 'malmo', label: 'Malmö', country: 'SE', active: false },
  { id: 'uppsala', label: 'Uppsala', country: 'SE', active: false },
]

export const DEFAULT_LOCATION_ID = 'stockholm'

export function getActiveLocations(): Location[] {
  return LOCATIONS.filter(l => l.active)
}

export function getLocationById(id: string | null | undefined): Location | null {
  if (!id) return null
  return LOCATIONS.find(l => l.id === id) ?? null
}

export function getLocationLabel(id: string | null | undefined): string {
  return getLocationById(id)?.label ?? getLocationById(DEFAULT_LOCATION_ID)!.label
}

/** Map legacy free-text city → location id. */
export function locationIdFromCity(city: string | null | undefined): string {
  if (!city) return DEFAULT_LOCATION_ID
  const normalized = city.trim().toLowerCase()
  const match = LOCATIONS.find(
    l => l.label.toLowerCase() === normalized || l.id === normalized
  )
  return match?.id ?? DEFAULT_LOCATION_ID
}
