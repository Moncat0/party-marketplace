import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_request_id, price_sek, description, duration, event_date, location, cancellation_policy } = await request.json()
  if (!booking_request_id || !price_sek || price_sek < 1) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify sender is the provider
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*, provider_profiles!provider_profile_id(id, user_id)')
    .eq('id', booking_request_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = (Array.isArray(booking.provider_profiles)
    ? booking.provider_profiles[0]
    : booking.provider_profiles) as { id: string; user_id: string } | null

  if (profile?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const price_ore = Math.round(price_sek * 100)

  // Create the quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      booking_request_id,
      provider_profile_id: profile.id,
      price_ore,
      description: description || null,
      duration: duration || null,
      event_date: event_date || null,
      location: location || null,
      cancellation_policy: cancellation_policy || null,
      status: 'pending',
    })
    .select()
    .single()

  if (quoteError || !quote) return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })

  // Create a message referencing the quote
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      booking_request_id,
      sender_id: user.id,
      content: null,
      quote_id: quote.id,
    })
    .select('*, users!sender_id(name), quotes(*)')
    .single()

  if (msgError || !message) return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })

  return NextResponse.json({ message })
}
