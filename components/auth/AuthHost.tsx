'use client'

import { useEffect, useState } from 'react'
import { parseAuthIntent, type AuthIntent } from '@/lib/auth-intent'
import { OPEN_AUTH_EVENT, type OpenAuthDetail } from '@/lib/open-auth'
import AuthModal from '@/components/auth/AuthModal'

export default function AuthHost() {
  const [open, setOpen] = useState(false)
  const [intent, setIntent] = useState<AuthIntent | null>(null)
  const [next, setNext] = useState<string | null>(null)

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenAuthDetail>).detail ?? {}
      setIntent(detail.intent ?? null)
      setNext(detail.next ?? null)
      setOpen(true)
    }
    window.addEventListener(OPEN_AUTH_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_AUTH_EVENT, onOpen)
  }, [])

  // Server redirects land on /?auth=1&intent=&next= — open modal and clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') !== '1') return

    setIntent(parseAuthIntent(params.get('intent')))
    setNext(params.get('next'))
    setOpen(true)

    params.delete('auth')
    params.delete('intent')
    params.delete('next')
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
    />
  )
}
