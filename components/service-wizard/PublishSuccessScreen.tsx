'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/categories'
import { getLocationLabel } from '@/lib/locations'
import { shareServiceListing } from '@/lib/service-share'
import { track } from '@/lib/posthog'
import type { ServiceWizardDraft } from '@/lib/service-wizard'

type Props = {
  serviceId: string
  draft: ServiceWizardDraft
  afterPublishPath: string
}

function fireConfetti() {
  const colors = ['#FF2E8A', '#1A1A2E', '#FFF8F3', '#F0EDE8']
  const end = Date.now() + 1200

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.55 },
    colors,
    disableForReducedMotion: true,
  })
  frame()
}

export default function PublishSuccessScreen({ serviceId, draft, afterPublishPath }: Props) {
  const [shareHint, setShareHint] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const cat = CATEGORIES.find(c => c.slug === draft.categorySlug)
  const city = getLocationLabel(draft.locationId)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const t = window.setTimeout(() => fireConfetti(), 180)
    return () => window.clearTimeout(t)
  }, [])

  async function handleShare() {
    setSharing(true)
    setShareHint(null)
    try {
      const result = await shareServiceListing({
        id: serviceId,
        title: draft.title,
        city,
        category_slug: draft.categorySlug,
        category_tags: null,
        origin: window.location.origin,
      })
      if (!result.shared) return
      track('provider_shared', {
        provider_id: serviceId,
        method: result.method,
        source: 'publish_success',
      })
      if (result.method === 'copy') {
        setShareHint('Meddelande kopierat — klistra in i WhatsApp eller Messages')
      }
    } catch {
      setShareHint('Kunde inte dela. Försök igen.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="w-full max-w-[480px] text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#FF2E8A]">
        Publicerad
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.5px] text-[#222222] sm:text-[34px]">
        Din tjänst är live!
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#6a6a6a]">
        Planerare i Stockholm kan hitta dig nu. Dela länken så fler hittar dig snabbare.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#dddddd] text-left">
        {draft.photos[0] ? (
          <div className="relative aspect-[16/10] bg-[#ebebeb]">
            <Image src={draft.photos[0]} alt="" fill className="object-cover" sizes="480px" />
          </div>
        ) : null}
        <div className="space-y-1 p-4">
          <p className="text-[16px] font-semibold text-[#222222]">{draft.title}</p>
          <p className="text-[14px] text-[#6a6a6a]">
            {cat?.label ?? 'Tjänst'} · {city}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          variant="dark"
          disabled={sharing}
          onClick={() => void handleShare()}
          className="h-12 w-full rounded-xl text-[16px] font-semibold"
        >
          {sharing ? 'Öppnar…' : 'Dela din tjänst'}
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-xl border-[#dddddd] text-[16px] font-semibold"
        >
          <Link href={`/tjanster/${serviceId}`}>Visa tjänst</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-11 w-full text-[15px] font-semibold text-[#6a6a6a]"
        >
          <Link href={afterPublishPath}>Till översikt</Link>
        </Button>
      </div>

      {shareHint ? <p className="mt-4 text-[13px] text-[#6a6a6a]">{shareHint}</p> : null}
    </div>
  )
}
