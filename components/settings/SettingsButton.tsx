'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

type Variant = 'primary' | 'secondary' | 'dark' | 'danger' | 'dangerOutline' | 'ghost'
type Size = 'default' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variants: Record<Variant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary: {
    bg: t.colors.primary,
    color: t.colors.onPrimary,
    border: 'transparent',
    hoverBg: t.colors.primaryActive,
  },
  secondary: {
    bg: t.colors.canvas,
    color: t.colors.ink,
    border: t.colors.hairline,
    hoverBg: t.colors.surfaceSoft,
  },
  dark: {
    bg: t.colors.ink,
    color: t.colors.onPrimary,
    border: 'transparent',
    hoverBg: '#111111',
  },
  danger: {
    bg: t.colors.error,
    color: t.colors.onPrimary,
    border: 'transparent',
    hoverBg: t.colors.errorHover,
  },
  dangerOutline: {
    bg: t.colors.canvas,
    color: t.colors.error,
    border: '#f5c6c0',
    hoverBg: '#fff5f3',
  },
  ghost: {
    bg: 'transparent',
    color: t.colors.muted,
    border: 'transparent',
    hoverBg: 'transparent',
  },
}

/** Source 1 button-primary / button-secondary geometry (48px / 8px radius). */
export default function SettingsButton({
  variant = 'primary',
  size = 'default',
  children,
  disabled,
  className = '',
  style,
  type = 'button',
  ...rest
}: Props) {
  const v = variants[variant]
  const isSm = size === 'sm'
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium disabled:opacity-40 ${
        isSm ? 'text-[12px] leading-[1.3]' : 'text-[14px] leading-[1.29]'
      } ${className}`}
      style={{
        minHeight: variant === 'ghost' ? undefined : isSm ? 36 : 48,
        padding: variant === 'ghost' ? '0' : isSm ? '8px 14px' : '14px 24px',
        borderRadius: t.rounded.sm,
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        transition: `background-color ${t.motion.fast} ${t.motion.easeStandard}, color ${t.motion.fast} ${t.motion.easeStandard}`,
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.backgroundColor = v.hoverBg
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = v.bg
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
