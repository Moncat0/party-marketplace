import { ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getGrowthMetrics } from '@/lib/admin-metrics'
import { formatPct, parseAdminRange, posthogAppUrl } from '@/lib/admin-range'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Admin — Tillväxt' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: { range?: string } }

export default async function AdminGrowthPage({ searchParams }: Props) {
  const range = parseAdminRange(searchParams.range)
  const supabase = createAdminClient()
  const metrics = await getGrowthMetrics(supabase, range)
  const funnelMax = Math.max(1, ...metrics.funnel.map(f => f.count))
  const posthogUrl = posthogAppUrl()

  return (
    <div>
      <AdminPageHeader
        title="Tillväxt"
        description="Funnlar och rates från tracking_events (synkat med PostHog-events)."
        range={range}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <a href={posthogUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" data-icon="inline-start" />
              Öppna PostHog
            </a>
          </Button>
        }
      />

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metrics.rates.map(r => (
          <div
            key={r.key}
            className="rounded-2xl border border-border bg-background p-4"
          >
            <p className="text-[13px] font-medium text-muted-foreground">{r.label}</p>
            <p className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">
              {formatPct(r.value, 1)}
            </p>
            <p className="mt-2 text-[12px] text-muted-foreground">{r.hint}</p>
          </div>
        ))}
      </section>

      <section className="mb-8 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-[16px] font-semibold text-foreground">Planner-funnel</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Från sök till accepterad förfrågan
        </p>
        <div className="mt-6 space-y-3">
          {metrics.funnel.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[13px] font-medium text-foreground">
                {step.label}
              </span>
              <div className="h-8 min-w-0 flex-1 overflow-hidden rounded-lg bg-muted">
                <div
                  className="flex h-full items-center rounded-lg bg-primary/85 px-2 text-[12px] font-semibold text-white"
                  style={{ width: `${Math.max(8, (step.count / funnelMax) * 100)}%` }}
                >
                  {step.count}
                </div>
              </div>
              {i > 0 ? (
                <span className="w-14 shrink-0 text-right text-[12px] text-muted-foreground">
                  {formatPct(
                    metrics.funnel[i - 1].count > 0
                      ? (step.count / metrics.funnel[i - 1].count) * 100
                      : null,
                    0
                  )}
                </span>
              ) : (
                <span className="w-14 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-[16px] font-semibold text-foreground">Event-volym</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Alla tracked events i perioden
        </p>
        <div className="mt-4 divide-y divide-border">
          {metrics.events.map(ev => (
            <div
              key={ev.key}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-foreground">{ev.label}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{ev.key}</p>
              </div>
              <div className="flex items-center gap-3">
                {ev.deltaPct != null ? (
                  <span
                    className={cn(
                      'text-[12px] font-medium',
                      ev.deltaPct > 0 && 'text-[#1D9E75]',
                      ev.deltaPct < 0 && 'text-destructive',
                      ev.deltaPct === 0 && 'text-muted-foreground'
                    )}
                  >
                    {ev.deltaPct > 0 ? '+' : ''}
                    {ev.deltaPct.toFixed(0)}%
                  </span>
                ) : null}
                <span className="min-w-[3rem] text-right text-[16px] font-semibold text-foreground">
                  {ev.count.toLocaleString('sv-SE')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
