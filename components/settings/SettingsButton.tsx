'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'dark' | 'danger' | 'dangerOutline' | 'ghost'
type Size = 'default' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantMap = {
  primary: 'default',
  secondary: 'outline',
  dark: 'dark',
  danger: 'destructive',
  dangerOutline: 'dangerOutline',
  ghost: 'ghost',
} as const

/** Settings / account CTAs — thin wrapper over shadcn Button + Gigtorget variants. */
export default function SettingsButton({
  variant = 'primary',
  size = 'default',
  children,
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <Button
      type={type}
      variant={variantMap[variant]}
      size={size}
      className={cn(variant === 'ghost' && 'h-auto px-0', className)}
      {...rest}
    >
      {children}
    </Button>
  )
}
