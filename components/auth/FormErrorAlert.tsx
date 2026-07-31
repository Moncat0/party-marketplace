'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

/** Shared destructive callout — use instead of one-off #fff5f3 boxes. */
export default function FormErrorAlert({ children, className }: Props) {
  if (!children) return null
  return (
    <Alert
      variant="destructive"
      className={cn(
        'rounded-xl border-[#f5c6c0] bg-[#fff5f3] text-[#C13515] [&>svg]:text-[#C13515]',
        className
      )}
    >
      <AlertCircle className="size-4" />
      <AlertDescription className="text-[13px] leading-snug text-[#C13515] [&_a]:underline">
        {children}
      </AlertDescription>
    </Alert>
  )
}
