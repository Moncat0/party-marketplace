/**
 * Google OAuth extras for DOB prefills on /complete-signup.
 * Birthday is not in the ID token — we request People API scope and fetch once.
 *
 * GCP checklist (festen project):
 * 1. Enable People API
 * 2. OAuth consent → add scope user.birthday.read
 *    (sensitive — may need Google verification in production)
 */

export const GOOGLE_BIRTHDAY_SCOPE =
  'https://www.googleapis.com/auth/user.birthday.read'

/** Scopes passed to Supabase `signInWithOAuth` / `linkIdentity` for Google. */
export const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  GOOGLE_BIRTHDAY_SCOPE,
].join(' ')

type GoogleBirthdayDate = {
  year?: number
  month?: number
  day?: number
}

type PeopleBirthdaysResponse = {
  birthdays?: Array<{
    date?: GoogleBirthdayDate
    metadata?: { primary?: boolean }
  }>
}

/**
 * Returns YYYY-MM-DD when Google provides a full date (year required for 18+).
 * Users can deny the scope or hide year — then returns null (field stays empty).
 */
export async function fetchGoogleBirthDate(
  providerAccessToken: string
): Promise<string | null> {
  if (!providerAccessToken) return null

  try {
    const res = await fetch(
      'https://people.googleapis.com/v1/people/me?personFields=birthdays',
      {
        headers: { Authorization: `Bearer ${providerAccessToken}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) {
      console.warn('[google-birthday] People API', res.status, await res.text())
      return null
    }

    const data = (await res.json()) as PeopleBirthdaysResponse
    const entries = data.birthdays ?? []
    const primary =
      entries.find(b => b.metadata?.primary && b.date) ??
      entries.find(b => b.date) ??
      null
    const d = primary?.date
    if (!d?.year || !d.month || !d.day) return null
    if (d.year < 1900 || d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) {
      return null
    }

    const yyyy = String(d.year)
    const mm = String(d.month).padStart(2, '0')
    const dd = String(d.day).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch (err) {
    console.warn('[google-birthday] fetch failed:', err)
    return null
  }
}
