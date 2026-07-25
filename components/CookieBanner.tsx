'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'

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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-sm rounded-2xl bg-[#1A1A2E] p-4 shadow-lg relative">
        <button
          onClick={handleDecline}
          aria-label="Stäng"
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
        >
          ✕
        </button>
        <p className="text-sm text-white mb-1 font-medium pr-6">Vi använder cookies 🍪</p>
        <p className="text-xs text-white/60 mb-4 leading-relaxed">
          Vi använder analyscookies för att förstå hur du använder FESTEN. och förbättra tjänsten.{' '}
          <Link href="/privacy" className="text-white/80 underline hover:text-white">Läs mer</Link>
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="flex-1 rounded-xl border border-white/20 py-2 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
          >
            Neka
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-[#FF6B35] py-2 text-xs font-semibold text-white hover:bg-[#e55a26] transition-colors"
          >
            Acceptera
          </button>
        </div>
      </div>
    </div>
  )
}
