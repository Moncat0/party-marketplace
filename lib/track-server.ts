import { createClient } from '@/lib/supabase-server'

export async function trackServer(
  eventName: string,
  properties: Record<string, unknown> = {},
  userId?: string
) {
  try {
    const supabase = await createClient()
    await supabase.from('tracking_events').insert({
      user_id: userId ?? null,
      event_name: eventName,
      properties,
    })
  } catch {
    // Never let tracking break the main flow
  }
}
