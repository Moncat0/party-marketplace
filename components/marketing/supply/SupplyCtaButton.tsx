'use client'

import { openAuth } from '@/lib/open-auth'
import { cn } from '@/lib/utils'

type Props = {
  label?: string
  className?: string
}

/** Pink pill CTA matching the supply design handoff. */
export default function SupplyCtaButton({
  label = 'Skapa din sida – gratis',
  className,
}: Props) {
  return (
    <button
      type="button"
      className={cn('supply-cta', className)}
      onClick={() => openAuth({ intent: 'provider', next: '/onboarding', mode: 'signup' })}
    >
      {label}
    </button>
  )
}
