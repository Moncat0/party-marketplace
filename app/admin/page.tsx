import Link from 'next/link'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getOverviewMetrics } from '@/lib/admin-metrics'
import { parseAdminRange, posthogAppUrl } from '@/lib/admin-range'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminKpiCard from '@/components/admin/AdminKpiCard'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Admin — Översikt' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: { range?: string } }

export default async function AdminOverviewPage({ searchParams }: Props) {
  const range = parseAdminRange(searchParams.range)
  const supabase = createAdminClient()
  const metrics = await getOverviewMetrics(supabase, range)
  const maxDay = Math.max(1, ...metrics.requestsByDay.map(d => d.count))
  const posthogUrl = posthogAppUrl()

  return (
    <div>
      <AdminPageHeader
        title="Översikt"
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

      {metrics.pendingAging > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" strokeWidth={2} />
          <div className="min-w-0 text-[14px]">
            <p className="font-medium text-amber-950">
              {metrics.pendingAging} förfrågningar väntar i mer än 48 timmar
            </p>
            <Link
              href="/admin/bookings"
              className="mt-1 inline-block font-medium text-amber-900 underline underline-offset-2"
            >
              Granska bokningar
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metrics.kpis.map(kpi => (
          <AdminKpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.secondary.map(kpi => (
          <AdminKpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-[16px] font-semibold text-foreground">Förfrågningar · 14 dagar</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">Volym per dag</p>
        <div className="mt-5 flex h-28 items-end gap-1.5">
          {metrics.requestsByDay.map(day => (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{
                  height: `${Math.max(4, (day.count / maxDay) * 100)}%`,
                }}
                title={`${day.date}: ${day.count}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{metrics.requestsByDay[0]?.date.slice(5)}</span>
          <span>{metrics.requestsByDay.at(-1)?.date.slice(5)}</span>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">Senaste aktivitet</h2>
          <Link
            href="/admin/bookings"
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            Alla bokningar
          </Link>
        </div>
        {metrics.activity.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">Ingen aktivitet ännu.</p>
        ) : (
          <div className="space-y-2">
            {metrics.activity.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-foreground">{item.label}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {new Date(item.at).toLocaleString('sv-SE')}
                  </p>
                </div>
                <AdminStatusBadge status={item.kind} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
