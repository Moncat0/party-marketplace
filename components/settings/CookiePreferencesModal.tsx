'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onClose: () => void
}

function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || posthog.__loaded) return
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: true,
  })
}

/** Cookie preferences dialog — same consent keys as CookieBanner. */
export default function CookiePreferencesModal({ open, onClose }: Props) {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null)

  useEffect(() => {
    if (!open) return
    const stored = localStorage.getItem('cookie_consent')
    if (stored === 'accepted' || stored === 'declined') setConsent(stored)
    else setConsent(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setConsent('accepted')
    initPostHog()
    onClose()
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined')
    setConsent('declined')
    if (posthog.__loaded) {
      try {
        posthog.opt_out_capturing()
      } catch {
        /* ignore */
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Stäng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="cookie-prefs-title" className="text-[22px] font-bold text-[#222222]">
            Cookie-preferenser
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Stäng"
            className="h-8 w-8 text-[#6a6a6a]"
          >
            ✕
          </Button>
        </div>
        <p className="mb-4 text-[14px] leading-[1.5] text-[#6a6a6a]">
          Välj vilka cookies du tillåter på FESTEN. Nödvändiga cookies behövs för inloggning och
          säkerhet. Analyscookies hjälper oss förstå hur tjänsten används.{' '}
          <Link href="/privacy" className="underline text-[#222222]" onClick={onClose}>
            Integritetspolicy
          </Link>
        </p>
        {consent && (
          <p className="mb-4 text-[13px] text-[#6a6a6a]">
            Nuvarande val:{' '}
            <span className="font-semibold text-[#222222]">
              {consent === 'accepted' ? 'Analyscookies accepterade' : 'Endast nödvändiga'}
            </span>
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={decline} className="flex-1">
            Endast nödvändiga
          </Button>
          <Button type="button" onClick={accept} className="flex-1">
            Acceptera alla
          </Button>
        </div>
      </div>
    </div>
  )
}
