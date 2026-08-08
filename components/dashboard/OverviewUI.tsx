import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { settingsTokens as t } from '@/components/settings/tokens'
import { cn } from '@/lib/utils'

export function OverviewGreeting({
  name,
  subtitle,
}: {
  name?: string | null
  subtitle: string
}) {
  const first = name?.split(' ')[0]
  return (
    <header className="mb-8">
      <h1
        className="text-[32px] font-medium leading-[1.125] tracking-[-0.8px]"
        style={{ color: t.colors.ink }}
      >
        Hej{first ? `, ${first}` : ''}
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: t.colors.muted }}>
        {subtitle}
      </p>
    </header>
  )
}

export function OverviewStatGrid({
  stats,
}: {
  stats: { value: number; label: string; emphasize?: boolean }[]
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3 sm:gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="bg-white p-4 sm:p-5"
          style={{
            borderRadius: t.rounded.md,
            border: `1px solid ${t.colors.hairline}`,
          }}
        >
          <p
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: stat.emphasize ? t.colors.primary : t.colors.ink }}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-[13px] sm:text-[14px]" style={{ color: t.colors.muted }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  )
}

export function OverviewBanner({
  variant,
  title,
  description,
  children,
}: {
  variant: 'neutral' | 'success' | 'warning' | 'primary'
  title: string
  description?: string
  children?: ReactNode
}) {
  const styles =
    variant === 'success'
      ? {
          background: 'rgba(29, 158, 117, 0.08)',
          border: '1px solid rgba(29, 158, 117, 0.2)',
          dot: t.colors.success,
        }
      : variant === 'warning' || variant === 'primary'
        ? {
            background: 'rgba(255, 46, 138, 0.08)',
            border: '1px solid rgba(255, 46, 138, 0.2)',
            dot: t.colors.primary,
          }
        : {
            background: t.colors.surfaceSoft,
            border: `1px solid ${t.colors.hairline}`,
            dot: t.colors.ink,
          }

  return (
    <div
      className="mb-6 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
      style={{ borderRadius: t.rounded.md, background: styles.background, border: styles.border }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ background: styles.dot }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: t.colors.ink }}>
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-[13px] sm:text-[14px]" style={{ color: t.colors.muted }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="flex flex-shrink-0 flex-wrap gap-2 sm:gap-3">{children}</div>}
    </div>
  )
}

export type OverviewAction = {
  href: string
  title: string
  description: string
  badge?: string | null
  /** Dark ink CTA card (primary action). */
  featured?: boolean
  icon?: ReactNode
}

export function OverviewActionGrid({ actions }: { actions: OverviewAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {actions.map(action => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            'block p-5 transition-colors sm:p-6',
            action.featured
              ? 'bg-[#222222] hover:bg-[#111111]'
              : 'bg-white hover:bg-[#f7f7f7]'
          )}
          style={{
            borderRadius: t.rounded.md,
            border: action.featured ? undefined : `1px solid ${t.colors.hairline}`,
          }}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {action.icon && (
                <span
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                    action.featured ? 'bg-white/10 text-white' : 'bg-[#f2f2f2] text-[#222222]'
                  )}
                  aria-hidden
                >
                  {action.icon}
                </span>
              )}
              <p
                className="font-semibold"
                style={{ color: action.featured ? '#fff' : t.colors.ink }}
              >
                {action.title}
              </p>
            </div>
            {action.badge && (
              <span className="flex-shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                {action.badge}
              </span>
            )}
          </div>
          <p
            className="text-[14px]"
            style={{ color: action.featured ? 'rgba(255,255,255,0.6)' : t.colors.muted }}
          >
            {action.description}
          </p>
        </Link>
      ))}
    </div>
  )
}

export function OverviewBannerButton({
  href,
  children,
  variant = 'dark',
}: {
  href: string
  children: ReactNode
  variant?: 'dark' | 'outline' | 'primary'
}) {
  return (
    <Button
      asChild
      variant={variant === 'outline' ? 'outline' : variant === 'primary' ? 'default' : 'dark'}
      size="sm"
      className="h-auto rounded-xl px-4 py-2 text-sm font-semibold"
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}
