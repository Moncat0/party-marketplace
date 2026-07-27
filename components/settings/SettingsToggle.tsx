'use client'

import { Button } from '@/components/ui/button'
import { settingsTokens as t } from './tokens'

type Props = {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Optional inline link under the label (e.g. Läs mer) */
  learnMore?: { label: string; onClick: () => void }
  /**
   * ink = Airbnb black switch with checkmark when on (privacy).
   * brand = ember primary (notifications).
   */
  variant?: 'ink' | 'brand'
}

/** Airbnb-style switch: track + white knob, checkmark when on (ink). */
export default function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  learnMore,
  variant = 'brand',
}: Props) {
  const onColor = variant === 'ink' ? '#222222' : t.colors.primary
  const offColor = '#b0b0b0'

  return (
    <div className="flex items-start justify-between gap-6 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-[1.25] text-[#222222]">{label}</p>
        {description && (
          <p className="mt-1 text-[14px] font-normal leading-[1.43] text-[#6a6a6a]">
            {description}
          </p>
        )}
        {learnMore && (
          <button
            type="button"
            onClick={learnMore.onClick}
            className="mt-1 text-[14px] font-normal text-[#222222] underline underline-offset-[3px] hover:text-[#6a6a6a]"
          >
            {learnMore.label}
          </button>
        )}
      </div>
      <Button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        variant="ghost"
        className="relative h-[32px] w-[48px] min-w-0 flex-shrink-0 rounded-full p-0 hover:bg-transparent focus-visible:ring-foreground disabled:opacity-50"
        style={{
          backgroundColor: checked ? onColor : offColor,
          transition: `background-color ${t.motion.fast} ${t.motion.easeStandard}`,
        }}
      >
        <span
          className="absolute top-[2px] left-[2px] flex h-7 w-7 items-center justify-center rounded-full bg-white"
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: `transform ${t.motion.fast} ${t.motion.easeWarm}`,
          }}
        >
          {checked && variant === 'ink' && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2 6.2L4.7 9L10 3"
                stroke="#222222"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </Button>
    </div>
  )
}
