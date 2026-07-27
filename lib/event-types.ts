/**
 * @deprecated Use `lib/occasions` — “event type” was renamed to occasion (tillfälle).
 * Kept so older imports keep working during the migration.
 */

export {
  OCCASIONS as EVENT_TYPES,
  type OccasionSlug as EventTypeValue,
  formatOccasion as formatEventType,
  formatOccasions,
  normalizeOccasions,
} from '@/lib/occasions'
