'use client'

import type { KeyboardEventHandler, ReactNode } from 'react'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  autoComplete?: string
  min?: string | number
  labelAction?: ReactNode
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
}

/**
 * Settings text field — Field + Input (shadcn), sized for Airbnb-style account forms.
 */
export default function SettingsInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  disabled = false,
  required = false,
  autoFocus = false,
  autoComplete,
  min,
  labelAction,
  onKeyDown,
}: Props) {
  return (
    <Field data-disabled={disabled || undefined} className="gap-2">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id} className="text-[14px] font-medium text-muted-foreground">
          {label}
        </FieldLabel>
        {labelAction}
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        placeholder={placeholder}
        min={min}
        onKeyDown={onKeyDown}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'h-14 rounded-lg border-border bg-background px-3 text-[16px] shadow-none',
          'focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground',
          'disabled:bg-muted disabled:opacity-100'
        )}
      />
      {hint ? <FieldDescription className="text-[13px]">{hint}</FieldDescription> : null}
    </Field>
  )
}
