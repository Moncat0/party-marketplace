'use client'

import { cn } from '@/lib/utils'
import {
  OCCASIONS,
  type OccasionSlug,
  toggleOccasion,
} from '@/lib/occasions'

type Props = {
  value: string[]
  onChange: (next: OccasionSlug[]) => void
  /** Limit chips to these slugs (e.g. service.occasions). Defaults to all. */
  options?: OccasionSlug[]
  className?: string
  size?: 'md' | 'sm'
}

export default function OccasionMultiSelect({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: Props) {
  const selected = new Set(value)
  const list = options?.length
    ? OCCASIONS.filter(o => options.includes(o.value))
    : OCCASIONS

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {list.map(o => {
        const active = selected.has(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(toggleOccasion(value, o.value))}
            className={cn(
              'rounded-full border font-medium transition',
              size === 'sm'
                ? 'px-3 py-1.5 text-[13px]'
                : 'px-4 py-2 text-[14px]',
              active
                ? 'border-[#222222] bg-[#222222] text-white'
                : 'border-[#dddddd] bg-white text-[#222222] hover:border-[#222222]'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
