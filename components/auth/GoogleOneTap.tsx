'use client'

import { useCallback, useEffect, useRef } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase'
import {
  INTENT_COOKIE,
  parseAuthIntent,
  setIntentCookie,
  type AuthIntent,
} from '@/lib/auth-intent'
import { AUTH_INTENT_METADATA_KEY } from '@/lib/ensure-user'
import { rememberAccount } from '@/lib/remembered-accounts'

type CredentialResponse = {
  credential: string
  select_by?: string
}

type PromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  isDisplayMoment?: () => boolean
  isDisplayed?: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
  getDismissedReason: () => string
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: CredentialResponse) => void
    nonce?: string
    context?: 'signin' | 'signup' | 'use'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
  }) => void
  prompt: (momentListener?: (notification: PromptNotification) => void) => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

async function generateNonce(): Promise<[string, string]> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  const nonce = btoa(binary)
  const encodedNonce = new TextEncoder().encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return [nonce, hashedNonce]
}

function readIntentCookie(): AuthIntent {
  if (typeof document === 'undefined') return 'planner'
  const match = document.cookie.match(new RegExp(`(?:^|; )${INTENT_COOKIE}=([^;]*)`))
  return parseAuthIntent(match?.[1] ? decodeURIComponent(match[1]) : null) ?? 'planner'
}

function continueHref(intent: AuthIntent): string {
  const path = window.location.pathname || '/'
  const search = window.location.search || ''
  const isAuthPath = path.startsWith('/auth') || path.startsWith('/complete-signup')
  const next = isAuthPath ? '/' : `${path}${search}`
  const params = new URLSearchParams({ next, intent })
  return `/auth/continue?${params.toString()}`
}

function logPromptMoment(notification: PromptNotification) {
  if (notification.isNotDisplayed()) {
    console.warn('[GoogleOneTap] not displayed:', notification.getNotDisplayedReason())
  } else if (notification.isSkippedMoment()) {
    console.warn('[GoogleOneTap] skipped:', notification.getSkippedReason())
  } else if (notification.isDismissedMoment()) {
    console.warn('[GoogleOneTap] dismissed:', notification.getDismissedReason())
  }
}

function whenIdle(cb: () => void) {
  if (typeof window === 'undefined') return
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
  ).requestIdleCallback
  if (typeof ric === 'function') {
    ric(() => cb(), { timeout: 2500 })
  } else {
    setTimeout(cb, 1200)
  }
}

/**
 * Google One Tap for logged-out visitors.
 * Loads lazily after idle so it never blocks first paint.
 */
export default function GoogleOneTap() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const started = useRef(false)
  const rawNonce = useRef<string | null>(null)

  const handleCredential = useCallback(async (response: CredentialResponse) => {
    const supabase = createClient()
    try {
      const intent = readIntentCookie()
      setIntentCookie(intent)

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: rawNonce.current ?? undefined,
      })
      if (error) throw error

      const user = data.user ?? data.session?.user
      if (user) {
        await supabase.auth.updateUser({
          data: { [AUTH_INTENT_METADATA_KEY]: intent },
        })
        if (user.email) {
          rememberAccount({
            email: user.email,
            name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          })
        }
      }

      window.location.href = continueHref(intent)
    } catch (err) {
      console.warn('[GoogleOneTap] sign-in failed:', err)
      started.current = false
    }
  }, [])

  const promptOnce = useCallback(
    async (useFedCm: boolean) => {
      if (!clientId || !window.google?.accounts?.id) return

      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        console.info('[GoogleOneTap] skipped: already signed in to Festly')
        return
      }

      const [nonce, hashedNonce] = await generateNonce()
      rawNonce.current = nonce

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        context: 'signin',
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
        use_fedcm_for_prompt: useFedCm,
        callback: response => {
          void handleCredential(response)
        },
      })

      window.google.accounts.id.prompt(notification => {
        logPromptMoment(notification)
        // One quick legacy retry if FedCM did not show — no multi-second awaits
        if (
          useFedCm &&
          (notification.isNotDisplayed() || notification.isSkippedMoment())
        ) {
          const reason = notification.isNotDisplayed()
            ? notification.getNotDisplayedReason()
            : notification.getSkippedReason()
          if (
            reason === 'unknown_reason' ||
            reason === 'browser_not_supported' ||
            reason === 'suppressed_by_user'
          ) {
            return
          }
          void promptOnce(false)
        }
      })
    },
    [clientId, handleCredential]
  )

  const start = useCallback(() => {
    if (!clientId || started.current || !window.google?.accounts?.id) return
    started.current = true
    whenIdle(() => {
      void promptOnce(true)
    })
  }, [clientId, promptOnce])

  useEffect(() => {
    if (!clientId) return
    if (window.google?.accounts?.id) start()
  }, [clientId, start])

  if (!clientId) return null

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="lazyOnload"
      onReady={() => start()}
    />
  )
}
