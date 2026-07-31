'use client'

import { useEffect, useState } from 'react'
import { parseAuthIntent, type AuthIntent } from '@/lib/auth-intent'
import { OPEN_AUTH_EVENT, type OpenAuthDetail } from '@/lib/open-auth'
import AuthModal from '@/components/auth/AuthModal'

export default function AuthHost() {
  const [open, setOpen] = useState(false)
  const [intent, setIntent] = useState<AuthIntent | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenAuthDetail>).detail ?? {}
      setIntent(detail.intent ?? null)
      setNext(detail.next ?? null)
      setMode(detail.mode ?? 'signup')
      setOpen(true)
      // Avoid stacking One Tap on top of the auth modal
      try {
        window.google?.accounts?.id?.cancel()
      } catch {
        /* ignore */
      }
    }
    window.addEventListener(OPEN_AUTH_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_AUTH_EVENT, onOpen)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') !== '1') return

    setIntent(parseAuthIntent(params.get('intent')))
    setNext(params.get('next'))
    const m = params.get('mode')
    setMode(m === 'login' ? 'login' : 'signup')
    setOpen(true)
    try {
      window.google?.accounts?.id?.cancel()
    } catch {
      /* ignore */
    }

    params.delete('auth')
    params.delete('intent')
    params.delete('next')
    params.delete('mode')
    const qs = params.toString()
    const path = window.location.pathname || '/'
    window.history.replaceState({}, '', qs ? `${path}?${qs}` : path)
  }, [])

  return (
    <AuthModal
      open={open}
      onOpenChange={setOpen}
      intent={intent}
      next={next}
      initialMode={mode}
    />
  )
}
