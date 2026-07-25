'use client'

import type { KeyboardEventHandler, ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

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

/** Source 1 `text-input`: white, 8px radius, 56px, focus 2px ink border — no glow. */
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
    <div>
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={id}
          className="block text-[14px] font-medium leading-[1.29] text-[#6a6a6a]"
        >
          {label}
        </label>
        {labelAction}
      </div>
      <input
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
        className="w-full bg-white text-[#222222] text-[16px] font-normal leading-[1.5] placeholder:text-[#929292] disabled:bg-[#f7f7f7] disabled:text-[#929292] focus:outline-none"
        style={{
          height: 56,
          padding: '14px 12px',
          borderRadius: t.rounded.sm,
          border: `1px solid ${t.colors.hairline}`,
          transition: `border-color ${t.motion.fast} ${t.motion.easeStandard}, border-width ${t.motion.fast} ${t.motion.easeStandard}`,
        }}
        onFocus={e => {
          e.currentTarget.style.border = `2px solid ${t.colors.ink}`
          e.currentTarget.style.padding = '13px 11px'
        }}
        onBlur={e => {
          e.currentTarget.style.border = `1px solid ${t.colors.hairline}`
          e.currentTarget.style.padding = '14px 12px'
        }}
      />
      {hint && (
        <p className="text-[13px] leading-[1.23] text-[#929292] mt-1.5">{hint}</p>
      )}
    </div>
  )
}
