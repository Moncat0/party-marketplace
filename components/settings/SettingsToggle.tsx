'use client'

import { Field, FieldContent, FieldDescription, FieldTitle } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Optional inline link under the label (e.g. Läs mer) */
  learnMore?: { label: string; onClick: () => void }
  /**
   * ink = black track when on (privacy).
   * brand = primary ember (notifications).
   */
  variant?: 'ink' | 'brand'
}

/** Settings switch — Field + Switch (shadcn). */
export default function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  learnMore,
  variant = 'brand',
}: Props) {
  return (
    <Field
      orientation="horizontal"
      data-disabled={disabled || undefined}
      className="items-start justify-between gap-6 py-1"
    >
      <FieldContent className="gap-1">
        <FieldTitle className="text-[16px] font-semibold text-foreground">{label}</FieldTitle>
        {description ? (
          <FieldDescription className="text-[14px] text-muted-foreground">
            {description}
          </FieldDescription>
        ) : null}
        {learnMore ? (
          <button
            type="button"
            onClick={learnMore.onClick}
            className="mt-0.5 w-fit text-[14px] text-foreground underline underline-offset-[3px] hover:text-muted-foreground"
          >
            {learnMore.label}
          </button>
        ) : null}
      </FieldContent>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
        className={cn(
          'mt-0.5 h-8 w-12 data-[state=checked]:bg-primary data-[state=unchecked]:bg-[#b0b0b0]',
          '[&>span]:h-7 [&>span]:w-7 [&>span]:data-[state=checked]:translate-x-4',
          variant === 'ink' && 'data-[state=checked]:bg-foreground'
        )}
      />
    </Field>
  )
}
