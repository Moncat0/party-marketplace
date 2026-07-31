'use client'

import { cn } from '@/lib/utils'
import {
  OCCASIONS,
  normalizeOccasions,
  type OccasionSlug,
} from '@/lib/occasions'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Props = {
  value: string[]
  onChange: (next: OccasionSlug[]) => void
  /** Limit chips to these slugs (e.g. service.occasions). Defaults to all. */
  options?: OccasionSlug[]
  className?: string
  size?: 'md' | 'sm'
}

/** Multi-select occasion chips — ToggleGroup (shadcn) + FESTEN pill styling. */
export default function OccasionMultiSelect({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: Props) {
  const list = options?.length
    ? OCCASIONS.filter(o => options.includes(o.value))
    : OCCASIONS

  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      value={value}
      onValueChange={next => onChange(normalizeOccasions(next))}
      className={cn('flex flex-wrap justify-start gap-2', className)}
    >
      {list.map(o => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          aria-label={o.label}
          className={cn(
            'rounded-full border font-medium shadow-none data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background',
            'border-border bg-background text-foreground hover:bg-accent',
            size === 'sm' ? 'h-auto px-3 py-1.5 text-[13px]' : 'h-auto px-4 py-2 text-[14px]'
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
