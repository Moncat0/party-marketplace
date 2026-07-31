'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

export type SelectOption = {
  value: string
  label: string
}

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

/** Labeled select — Field + Select (shadcn). */
export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Välj...',
  className,
}: Props) {
  return (
    <Field className={cn('gap-2', className)}>
      <FieldLabel className="text-[10px] font-bold uppercase tracking-wide text-foreground">
        {label}
      </FieldLabel>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-auto min-h-10 w-full border-0 px-0 text-[14px] shadow-none focus:ring-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
