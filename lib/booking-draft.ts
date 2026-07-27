/** Persist booking-request form across auth redirects (OAuth / full page reload). */

export type BookingFormData = {
  event_date: string
  event_type: string
  event_location: string
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
  event_type: '',
  event_location: '',
  guest_count: '',
  description: '',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
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
    data,
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
    const parsed = JSON.parse(raw) as BookingDraft
    if (!parsed || parsed.serviceId !== serviceId || !parsed.data) return null
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) {
      clearBookingDraft()
      return null
    }
    return parsed
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
