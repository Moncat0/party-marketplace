import { formatEventType, formatOccasions } from '@/lib/event-types'

/** Prefer multi occasions; fall back to legacy single event_type. */
export function bookingOccasionLabel(booking: {
  occasions?: string[] | null
  event_type?: string | null
}): string | null {
  return formatOccasions(booking.occasions) ?? formatEventType(booking.event_type)
}
