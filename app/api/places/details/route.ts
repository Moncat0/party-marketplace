import { NextResponse, type NextRequest } from 'next/server'
import { fetchPlaceDetails, isPlacesConfigured } from '@/lib/google-places'

export async function GET(request: NextRequest) {
  if (!isPlacesConfigured()) {
    return NextResponse.json(
      { place: null, error: 'places_not_configured' },
      { status: 503 }
    )
  }

  const placeId = request.nextUrl.searchParams.get('placeId')?.trim() ?? ''
  const sessionToken = request.nextUrl.searchParams.get('session') ?? undefined

  if (!placeId) {
    return NextResponse.json({ place: null, error: 'missing_place_id' }, { status: 400 })
  }

  const { place, error } = await fetchPlaceDetails(placeId, sessionToken)
  if (!place) {
    return NextResponse.json({ place: null, error: error ?? 'not_found' }, { status: 502 })
  }

  return NextResponse.json({ place })
}
