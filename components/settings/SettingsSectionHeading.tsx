import type { ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

type Props = {
  title: string
  /** Optional action aligned to the right of the heading (e.g. log out all) */
  action?: ReactNode
  className?: string
  /**
   * underline (default): hairline under the title — Login & security style.
   * false: title only — Privacy style (dividers sit after section content).
   */
  underline?: boolean
}

/** Airbnb section title. */
export default function SettingsSectionHeading({
  title,
  action,
  className = '',
  underline = true,
}: Props) {
  return (
    <div
      className={`mb-0 mt-10 first:mt-6 ${className}`}
      style={underline ? { borderBottom: `1px solid ${t.colors.hairlineSoft}` } : undefined}
    >
      <div
        className={`flex flex-wrap items-end justify-between gap-3 ${underline ? 'pb-4' : ''}`}
      >
        <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#222222]">
          {title}
        </h3>
        {action}
      </div>
    </div>
  )
}
