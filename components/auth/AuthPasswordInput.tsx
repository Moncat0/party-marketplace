'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export const authInputClass =
  'h-14 w-full rounded-xl border border-border bg-background px-4 text-[16px] leading-none text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground'

type Props = Omit<React.ComponentProps<'input'>, 'type'> & {
  wrapperClassName?: string
}

/**
 * Auth password input with Airbnb-style show/hide control.
 */
export default function AuthPasswordInput({
  className,
  wrapperClassName,
  id,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn('relative', wrapperClassName)}>
      <input
        {...props}
        id={id}
        type={visible ? 'text' : 'password'}
        className={cn(authInputClass, 'pr-12', className)}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Dölj lösenord' : 'Visa lösenord'}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        ) : (
          <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  )
}
