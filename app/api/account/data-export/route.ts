import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendDataExportReady } from '@/lib/resend'
import { rateLimit } from '@/lib/rateLimit'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = await rateLimit(user.id, 'data_export', 2, 86400)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Du har redan begärt en export nyligen. Försök igen imorgon.' },
      { status: 429 }
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select(
      'id, email, name, first_name, last_name, preferred_first_name, phone, user_type, auth_provider, signup_source, address_line1, address_line2, address_city, address_postal_code, address_country, privacy_read_receipts, privacy_review_show_city, privacy_review_show_booked_services, notif_marketing, created_at, data_export_requested_at'
    )
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (profile.data_export_requested_at) {
    const last = new Date(profile.data_export_requested_at).getTime()
    if (Date.now() - last < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Du har redan begärt en export under senaste dygnet.' },
        { status: 429 }
      )
    }
  }

  const [
    { data: providerProfiles },
    { data: bookingsAsPlanner },
    { data: reviewsWritten },
    { data: reviewsReceived },
    { data: shortlists },
    { data: messagesSent },
  ] = await Promise.all([
    supabase.from('provider_profiles').select('*, services(*)').eq('user_id', user.id),
    supabase.from('booking_requests').select('*').eq('planner_id', user.id),
    supabase.from('reviews').select('*').eq('reviewer_id', user.id),
    supabase.from('reviews').select('*').eq('reviewee_id', user.id),
    supabase.from('shortlists').select('*, shortlist_items(*)').eq('planner_id', user.id),
    supabase
      .from('messages')
      .select('id, booking_request_id, content, created_at')
      .eq('sender_id', user.id),
  ])

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: profile,
    provider_profiles: providerProfiles ?? [],
    booking_requests_as_planner: bookingsAsPlanner ?? [],
    reviews_written: reviewsWritten ?? [],
    reviews_received: reviewsReceived ?? [],
    shortlists: shortlists ?? [],
    messages_sent: messagesSent ?? [],
  }

  const json = JSON.stringify(exportPayload, null, 2)

  try {
    await sendDataExportReady(profile.email, profile.name ?? 'där', json)
  } catch (e) {
    console.error('Data export email failed:', e)
    return NextResponse.json(
      { error: 'Kunde inte skicka exporten. Försök igen senare.' },
      { status: 500 }
    )
  }

  await supabase
    .from('users')
    .update({ data_export_requested_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
