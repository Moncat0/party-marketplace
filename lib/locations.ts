/**
 * All active Swedish cities for Gigtorget.
 * Used for both provider home city (basedIn) and service location.
 */

export type Location = {
  id: string
  label: string
  country: 'SE'
  active: boolean
}

export const LOCATIONS: Location[] = [
  { id: 'stockholm',    label: 'Stockholm',    country: 'SE', active: true },
  { id: 'goteborg',    label: 'Göteborg',     country: 'SE', active: true },
  { id: 'malmo',       label: 'Malmö',        country: 'SE', active: true },
  { id: 'uppsala',     label: 'Uppsala',      country: 'SE', active: true },
  { id: 'vasteras',    label: 'Västerås',     country: 'SE', active: true },
  { id: 'orebro',      label: 'Örebro',       country: 'SE', active: true },
  { id: 'linkoping',   label: 'Linköping',    country: 'SE', active: true },
  { id: 'helsingborg', label: 'Helsingborg',  country: 'SE', active: true },
  { id: 'jonkoping',   label: 'Jönköping',    country: 'SE', active: true },
  { id: 'norrkoping',  label: 'Norrköping',   country: 'SE', active: true },
  { id: 'lund',        label: 'Lund',         country: 'SE', active: true },
  { id: 'umea',        label: 'Umeå',         country: 'SE', active: true },
  { id: 'gavle',       label: 'Gävle',        country: 'SE', active: true },
  { id: 'boras',       label: 'Borås',        country: 'SE', active: true },
  { id: 'sundsvall',   label: 'Sundsvall',    country: 'SE', active: true },
  { id: 'eskilstuna',  label: 'Eskilstuna',   country: 'SE', active: true },
  { id: 'halmstad',    label: 'Halmstad',     country: 'SE', active: true },
  { id: 'vaxjo',       label: 'Växjö',        country: 'SE', active: true },
  { id: 'karlstad',    label: 'Karlstad',     country: 'SE', active: true },
  { id: 'ostersund',   label: 'Östersund',    country: 'SE', active: true },
  { id: 'sodertalje',  label: 'Södertälje',   country: 'SE', active: true },
  { id: 'karlskrona',  label: 'Karlskrona',   country: 'SE', active: true },
  { id: 'falun',       label: 'Falun',        country: 'SE', active: true },
  { id: 'kristianstad',label: 'Kristianstad', country: 'SE', active: true },
  { id: 'kalmar',      label: 'Kalmar',       country: 'SE', active: true },
  { id: 'lulea',       label: 'Luleå',        country: 'SE', active: true },
  { id: 'trollhattan', label: 'Trollhättan',  country: 'SE', active: true },
  { id: 'skovde',      label: 'Skövde',       country: 'SE', active: true },
  { id: 'nykoping',    label: 'Nyköping',     country: 'SE', active: true },
  { id: 'visby',       label: 'Visby',        country: 'SE', active: true },
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

export function locationIdFromCity(city: string | null | undefined): string {
  if (!city) return DEFAULT_LOCATION_ID
  const normalized = city.trim().toLowerCase()
  const match = LOCATIONS.find(
    l => l.label.toLowerCase() === normalized || l.id === normalized
  )
  return match?.id ?? DEFAULT_LOCATION_ID
}
