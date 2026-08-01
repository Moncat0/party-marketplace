'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AdminRange } from '@/lib/admin-range'

const OPTIONS: { value: AdminRange; label: string }[] = [
  { value: '7d', label: '7 dagar' },
  { value: '30d', label: '30 dagar' },
  { value: 'all', label: 'Alla' },
]

export default function AdminRangeToggle({ value }: { value: AdminRange }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div className="inline-flex rounded-xl border border-border bg-background p-0.5">
      {OPTIONS.map(opt => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('range', opt.value)
        const active = value === opt.value
        return (
          <Link
            key={opt.value}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              'rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </Link>
        )
      })}
    </div>
  )
}
