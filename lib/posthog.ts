import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase'

/**
 * Client analytics: PostHog + durable `tracking_events` dual-write
 * (spec §8). Never throw — tracking must not break UX.
 */
export function track(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  try {
    posthog.capture(eventName, properties)
  } catch {
    // ignore
  }

  void persistTrackingEvent(eventName, properties)
}

async function persistTrackingEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await supabase.from('tracking_events').insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      properties: properties ?? {},
    })
  } catch {
    // Never let tracking break the main flow
  }
}
