import type { AuthIntent } from '@/lib/auth-intent'

export const OPEN_AUTH_EVENT = 'festen:open-auth'

/** Subset of AuthPanel views that can be opened via openAuth / ?view= */
export type OpenAuthView =
  | 'fresh'
  | 'password'
  | 'forgot-password'
  | 'forgot-sent'
  | 'finish-signup'
  | 'check-email'
  | 'welcome'

export type OpenAuthDetail = {
  intent?: AuthIntent | null
  next?: string | null
  /** Prefer login (header) vs signup (soft gate / offer service). Default signup. */
  mode?: 'login' | 'signup'
  /** Jump straight to a modal step (e.g. forgot-password). */
  view?: OpenAuthView | null
}

/** Open the global auth modal when AuthHost is mounted; otherwise no-op. */
export function openAuth(detail: OpenAuthDetail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_AUTH_EVENT, { detail }))
}
