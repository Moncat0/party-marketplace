import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { sendReviewReminder } from '@/lib/resend'

// Called by Vercel Cron — runs daily
// Add to vercel.json: { "crons": [{ "path": "/api/cron/review-reminders", "schedule": "0 10 * * *" }] }
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Find accepted bookings where event_date was yesterday (or earlier but still 'accepted')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('*, users!planner_id(id, name, email), provider_profiles!provider_profile_id(user_id, service_title, users(name, email))')
    .eq('status', 'accepted')
    .lte('event_date', dateStr)

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Mark all found bookings as completed
  const bookingIds = bookings.map(b => b.id)
  await supabase
    .from('booking_requests')
    .update({ status: 'completed' })
    .in('id', bookingIds)

  let sent = 0
  for (const booking of bookings) {
    const planner = booking.users as { id: string; name: string | null; email: string } | null
    const profile = booking.provider_profiles as { user_id: string; service_title: string | null; users: { name: string | null; email: string } | null } | null
    const providerName = profile?.users?.name ?? profile?.service_title ?? 'Talangen'
    const plannerName = planner?.name ?? 'Arrangören'

    try {
      if (planner?.email) {
        await sendReviewReminder(planner.email, plannerName, providerName, booking.id)
        sent++
      }
      if (profile?.users?.email) {
        await sendReviewReminder(profile.users.email, providerName, plannerName, booking.id)
        sent++
      }
    } catch (err) {
      console.error('Review reminder failed for booking', booking.id, err)
    }
  }

  return NextResponse.json({ sent })
}
