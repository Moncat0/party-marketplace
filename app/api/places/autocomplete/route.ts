import { NextResponse, type NextRequest } from 'next/server'
import { fetchPlaceSuggestions, isPlacesConfigured } from '@/lib/google-places'

export async function GET(request: NextRequest) {
  if (!isPlacesConfigured()) {
    return NextResponse.json(
      { suggestions: [], error: 'places_not_configured' },
      { status: 503 }
    )
  }

  const input = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const sessionToken = request.nextUrl.searchParams.get('session') ?? undefined

  if (input.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const { suggestions, error } = await fetchPlaceSuggestions(input, sessionToken)
  if (error && suggestions.length === 0) {
    return NextResponse.json({ suggestions: [], error }, { status: 502 })
  }

  return NextResponse.json({ suggestions })
}
