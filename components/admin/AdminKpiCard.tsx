import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/lib/admin-metrics'
import { formatPct } from '@/lib/admin-range'

function formatValue(kpi: Kpi): string {
  if (kpi.format === 'percent') return formatPct(kpi.value, 0)
  return kpi.value.toLocaleString('sv-SE')
}

export default function AdminKpiCard({ kpi }: { kpi: Kpi }) {
  const delta = kpi.deltaPct
  const content = (
    <div
      className={cn(
        'rounded-2xl border border-border bg-background p-4 transition-colors',
        kpi.href && 'hover:bg-accent/40'
      )}
    >
      <p className="text-[13px] font-medium text-muted-foreground">{kpi.label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-foreground">
        {formatValue(kpi)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta != null ? (
          <span
            className={cn(
              'text-[12px] font-medium',
              delta > 0 && 'text-[#1D9E75]',
              delta < 0 && 'text-destructive',
              delta === 0 && 'text-muted-foreground'
            )}
          >
            {delta > 0 ? '+' : ''}
            {kpi.format === 'percent' ? `${delta.toFixed(0)} pp` : `${delta.toFixed(0)}%`}
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            {kpi.hint ?? '—'}
          </span>
        )}
        {delta != null && kpi.hint ? (
          <span className="text-[12px] text-muted-foreground">{kpi.hint}</span>
        ) : null}
      </div>
    </div>
  )

  if (kpi.href) {
    return (
      <Link href={kpi.href} className="block">
        {content}
      </Link>
    )
  }
  return content
}
