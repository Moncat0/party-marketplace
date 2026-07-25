import { createClient } from '@/lib/supabase-server'

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Check and record a rate-limited action for a given user.
 *
 * @param userId      - The authenticated user's ID
 * @param action      - A short label for the action, e.g. "invite" or "message"
 * @param maxRequests - Max allowed calls within the window
 * @param windowSecs  - Rolling window in seconds (e.g. 3600 = 1 hour)
 */
export async function rateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const supabase = await createClient()
  const key = `${userId}:${action}`
  const windowStart = new Date(Date.now() - windowSecs * 1000).toISOString()

  // Count how many hits exist in the current window
  const { count, error: countError } = await supabase
    .from('rate_limit_hits')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)

  if (countError) {
    // If we can't read the table, fail open (don't block the user)
    console.error('rateLimit count error:', countError)
    return { allowed: true }
  }

  if ((count ?? 0) >= maxRequests) {
    return { allowed: false, retryAfterSeconds: windowSecs }
  }

  // Record this hit
  const { error: insertError } = await supabase
    .from('rate_limit_hits')
    .insert({ key })

  if (insertError) {
    console.error('rateLimit insert error:', insertError)
  }

  return { allowed: true }
}
