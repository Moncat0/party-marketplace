export type HostNameFields = {
  preferred_first_name?: string | null
  first_name?: string | null
  last_name?: string | null
  name?: string | null
}

/** Supabase select fragment for host identity on listings. */
export const HOST_USERS_SELECT =
  'name, first_name, last_name, preferred_first_name, avatar_url'

/**
 * Public host name shown on listings and cards.
 * Prefers preferred first name, then legal first name, then full `name`.
 * Appends last name when present so “Meet” still feels complete.
 */
export function hostDisplayName(fields: HostNameFields): string {
  const preferred = (fields.preferred_first_name ?? '').trim()
  const first = (fields.first_name ?? '').trim()
  const last = (fields.last_name ?? '').trim()
  const full = (fields.name ?? '').trim()

  const given = preferred || first
  if (given && last) return `${given} ${last}`
  if (given) return given
  return full
}

/** Normalize nested `users` row to the card/listing shape (`name` = display name). */
export function hostUserForDisplay(
  user:
    | (HostNameFields & { avatar_url?: string | null })
    | null
    | undefined
): { name: string | null; avatar_url: string | null } | null {
  if (!user) return null
  const name = hostDisplayName(user)
  return {
    name: name || null,
    avatar_url: user.avatar_url ?? null,
  }
}
