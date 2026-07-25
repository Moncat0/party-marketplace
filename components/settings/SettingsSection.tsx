'use client'

import type { ReactNode } from 'react'
import { settingsTokens as t } from './tokens'

type Props = {
  title: string
  description?: string
  children: ReactNode
}

/** Settings section card — Source 1 reservation/host card: white, hairline, rounded.md, 24px pad. */
export default function SettingsSection({ title, description, children }: Props) {
  return (
    <section
      className="bg-white"
      style={{
        borderRadius: t.rounded.md,
        border: `1px solid ${t.colors.hairline}`,
        padding: 24,
        boxShadow: 'none',
      }}
    >
      <h2 className="text-[16px] font-semibold leading-[1.25] text-[#222222] mb-1">{title}</h2>
      {description && (
        <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-5">{description}</p>
      )}
      {!description && <div className="mb-5" />}
      {children}
    </section>
  )
}
