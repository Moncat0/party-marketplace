/** Persist booking-request form across auth redirects (OAuth / full page reload). */

import { normalizeOccasions } from '@/lib/occasions'

export type BookingFormData = {
  event_date: string
  /** Selected occasions (multi). */
  occasions: string[]
  event_location: string
  /** Google Places place id when selected from autocomplete */
  event_place_id: string | null
  event_lat: number | null
  event_lng: number | null
  guest_count: string
  description: string
}

export type BookingDraft = {
  serviceId: string
  data: BookingFormData
  /** User clicked “Skicka förfrågan” while logged out — auto-submit after login. */
  pendingSubmit?: boolean
  savedAt: number
}

const STORAGE_KEY = 'festen_booking_draft'
const MAX_AGE_MS = 1000 * 60 * 60 * 24 // 24h
/** Only auto-send if login completed soon after “Skicka förfrågan”. */
export const AUTO_SUBMIT_WINDOW_MS = 1000 * 60 * 15

export const EMPTY_BOOKING_FORM: BookingFormData = {
  event_date: '',
  occasions: [],
  event_location: '',
  event_place_id: null,
  event_lat: null,
  event_lng: null,
  guest_count: '',
  description: '',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

function asNullableNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return null
}

function normalizeFormData(
  raw: Partial<BookingFormData> & { event_type?: string }
): BookingFormData {
  const fromLegacy =
    !raw.occasions?.length && typeof raw.event_type === 'string' && raw.event_type
      ? [raw.event_type]
      : raw.occasions
  return {
    event_date: raw.event_date ?? '',
    occasions: normalizeOccasions(fromLegacy),
    event_location: raw.event_location ?? '',
    event_place_id:
      typeof raw.event_place_id === 'string' && raw.event_place_id.trim()
        ? raw.event_place_id.trim()
        : null,
    event_lat: asNullableNumber(raw.event_lat),
    event_lng: asNullableNumber(raw.event_lng),
    guest_count: raw.guest_count ?? '',
    description: raw.description ?? '',
  }
}

export function saveBookingDraft(
  serviceId: string,
  data: BookingFormData,
  opts?: { pendingSubmit?: boolean }
) {
  if (!canUseStorage() || !serviceId) return
  const prev = loadBookingDraft(serviceId)
  const draft: BookingDraft = {
    serviceId,
    data: normalizeFormData(data),
    pendingSubmit: opts?.pendingSubmit ?? prev?.pendingSubmit ?? false,
    savedAt: Date.now(),
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Quota / private mode — ignore
  }
}

export function loadBookingDraft(serviceId: string): BookingDraft | null {
  if (!canUseStorage() || !serviceId) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BookingDraft & {
      data?: BookingFormData & { event_type?: string }
    }
    if (!parsed || parsed.serviceId !== serviceId || !parsed.data) return null
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) {
      clearBookingDraft()
      return null
    }
    return {
      ...parsed,
      data: normalizeFormData(parsed.data),
    }
  } catch {
    return null
  }
}

export function clearBookingDraft() {
  if (!canUseStorage()) return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function clearBookingDraftPending(serviceId: string) {
  const draft = loadBookingDraft(serviceId)
  if (!draft) return
  saveBookingDraft(serviceId, draft.data, { pendingSubmit: false })
}
