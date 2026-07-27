export type RememberedAccount = {
  email: string
  name?: string | null
  avatarUrl?: string | null
  lastLoginAt: string
}

const STORAGE_KEY = 'festen_remembered_accounts'
const MAX_ACCOUNTS = 3

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.indexOf('@')
  if (at <= 0) return trimmed
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  if (local.length <= 1) return `${local}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

export function getRememberedAccounts(): RememberedAccount[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is RememberedAccount =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as RememberedAccount).email === 'string' &&
          typeof (item as RememberedAccount).lastLoginAt === 'string'
      )
      .slice(0, MAX_ACCOUNTS)
  } catch {
    return []
  }
}

export function rememberAccount(input: {
  email: string
  name?: string | null
  avatarUrl?: string | null
}): RememberedAccount[] {
  if (!canUseStorage()) return []
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) return getRememberedAccounts()

  const next: RememberedAccount = {
    email,
    name: input.name ?? null,
    avatarUrl: input.avatarUrl ?? null,
    lastLoginAt: new Date().toISOString(),
  }

  const existing = getRememberedAccounts().filter(
    a => a.email.toLowerCase() !== email
  )
  const updated = [next, ...existing].slice(0, MAX_ACCOUNTS)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore quota / private mode
  }
  return updated
}

export function clearRememberedAccounts(): void {
  if (!canUseStorage()) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function formatLastLogin(iso: string, locale = 'sv-SE'): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return `Senast inloggad ${d.toLocaleDateString(locale)}`
  } catch {
    return ''
  }
}
