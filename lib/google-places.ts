/**
 * Google Places API (New) helpers — used by /api/places/* server routes.
 * Requires GOOGLE_PLACES_API_KEY (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) with
 * Places API (New) enabled on the GCP project (festen).
 */

export type PlaceSuggestion = {
  placeId: string
  /** Primary line, e.g. street + number */
  mainText: string
  /** Secondary line, e.g. postcode + city */
  secondaryText: string
  /** Combined label for the input */
  description: string
}

export type PlaceDetails = {
  placeId: string
  formattedAddress: string
  lat: number | null
  lng: number | null
}

function placesApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    null
  )
}

export function isPlacesConfigured(): boolean {
  return !!placesApiKey()
}

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
      structuredFormat?: {
        mainText?: { text?: string }
        secondaryText?: { text?: string }
      }
    }
  }>
  error?: { message?: string; status?: string }
}

export async function fetchPlaceSuggestions(
  input: string,
  sessionToken?: string
): Promise<{ suggestions: PlaceSuggestion[]; error: string | null }> {
  const key = placesApiKey()
  if (!key) {
    return { suggestions: [], error: 'Places API is not configured.' }
  }

  const trimmed = input.trim()
  if (trimmed.length < 2) {
    return { suggestions: [], error: null }
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
      },
      body: JSON.stringify({
        input: trimmed,
        languageCode: 'sv',
        includedRegionCodes: ['se'],
        ...(sessionToken ? { sessionToken } : {}),
      }),
      cache: 'no-store',
    })

    const data = (await res.json()) as AutocompleteResponse
    if (!res.ok) {
      console.warn('[places] autocomplete', res.status, data)
      return {
        suggestions: [],
        error: data.error?.message ?? 'Kunde inte söka adresser.',
      }
    }

    const suggestions: PlaceSuggestion[] = (data.suggestions ?? [])
      .map(s => {
        const p = s.placePrediction
        if (!p?.placeId) return null
        const mainText = p.structuredFormat?.mainText?.text ?? p.text?.text ?? ''
        const secondaryText = p.structuredFormat?.secondaryText?.text ?? ''
        const description =
          p.text?.text ?? [mainText, secondaryText].filter(Boolean).join(', ')
        return {
          placeId: p.placeId,
          mainText,
          secondaryText,
          description,
        }
      })
      .filter((s): s is PlaceSuggestion => !!s)

    return { suggestions, error: null }
  } catch (err) {
    console.warn('[places] autocomplete failed:', err)
    return { suggestions: [], error: 'Kunde inte söka adresser.' }
  }
}

type PlaceDetailsResponse = {
  id?: string
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  error?: { message?: string }
}

export async function fetchPlaceDetails(
  placeId: string,
  sessionToken?: string
): Promise<{ place: PlaceDetails | null; error: string | null }> {
  const key = placesApiKey()
  if (!key) {
    return { place: null, error: 'Places API is not configured.' }
  }

  const id = placeId.replace(/^places\//, '')
  if (!id) {
    return { place: null, error: 'Ogiltig plats.' }
  }

  try {
    const params = new URLSearchParams()
    if (sessionToken) params.set('sessionToken', sessionToken)
    const qs = params.toString()
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`

    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'id,formattedAddress,location',
      },
      cache: 'no-store',
    })

    const data = (await res.json()) as PlaceDetailsResponse
    if (!res.ok) {
      console.warn('[places] details', res.status, data)
      return {
        place: null,
        error: data.error?.message ?? 'Kunde inte hämta adressen.',
      }
    }

    const formatted = data.formattedAddress?.trim()
    if (!formatted) {
      return { place: null, error: 'Adressen saknar format.' }
    }

    return {
      place: {
        placeId: data.id?.replace(/^places\//, '') ?? id,
        formattedAddress: formatted,
        lat: data.location?.latitude ?? null,
        lng: data.location?.longitude ?? null,
      },
      error: null,
    }
  } catch (err) {
    console.warn('[places] details failed:', err)
    return { place: null, error: 'Kunde inte hämta adressen.' }
  }
}
