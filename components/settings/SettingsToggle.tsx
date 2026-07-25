'use client'

import { settingsTokens as t } from './tokens'

type Props = {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

/**
 * Toggle inferred from Source 1 pill radius + surface-strong / primary,
 * with motion-fast (160ms) from the build guide (Source 2 has no motion tokens).
 */
export default function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-medium leading-[1.25] text-[#222222]">{label}</p>
        {description && (
          <p className="text-[14px] font-normal leading-[1.43] text-[#6a6a6a] mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 h-8 w-12 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:ring-offset-2 disabled:opacity-40"
        style={{
          backgroundColor: checked ? t.colors.primary : t.colors.surfaceStrong,
          transition: `background-color ${t.motion.fast} ${t.motion.easeStandard}`,
        }}
      >
        <span
          className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white"
          style={{
            boxShadow: t.shadow,
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: `transform ${t.motion.fast} ${t.motion.easeWarm}`,
          }}
        />
      </button>
    </div>
  )
}
