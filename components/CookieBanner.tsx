'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setVisible(true)
    } else if (consent === 'accepted') {
      initPostHog()
    }
  }, [])

  function initPostHog() {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || posthog.__loaded) return
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: true,
    })
  }

  function handleAccept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
    initPostHog()
  }

  function handleDecline() {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-sm rounded-2xl bg-foreground p-4 shadow-lg relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDecline}
          aria-label="Stäng"
          className="absolute top-2 right-2 h-8 w-8 text-background/40 hover:text-background/80 hover:bg-background/10"
        >
          ✕
        </Button>
        <p className="text-sm text-background mb-1 font-medium pr-6">Vi använder cookies 🍪</p>
        <p className="text-xs text-background/60 mb-4 leading-relaxed">
          Vi använder analyscookies för att förstå hur du använder Festly och förbättra tjänsten.{' '}
          <Link href="/privacy" className="text-background/80 underline hover:text-background">
            Läs mer
          </Link>
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="flex-1 border-background/20 bg-transparent text-background/70 hover:bg-background/10 hover:text-background"
          >
            Neka
          </Button>
          <Button type="button" size="sm" onClick={handleAccept} className="flex-1 rounded-xl">
            Acceptera
          </Button>
        </div>
      </div>
    </div>
  )
}
