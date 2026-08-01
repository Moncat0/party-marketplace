import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getMarketplaceMetrics } from '@/lib/admin-metrics'
import { formatPct, parseAdminRange } from '@/lib/admin-range'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'

export const metadata = { title: 'Admin — Marknad' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: { range?: string } }

export default async function AdminMarketplacePage({ searchParams }: Props) {
  const range = parseAdminRange(searchParams.range)
  const supabase = createAdminClient()
  const metrics = await getMarketplaceMetrics(supabase, range)
  const catMax = Math.max(1, ...metrics.byCategory.map(c => c.count))

  return (
    <div>
      <AdminPageHeader
        title="Marknad"
        description="Utbud, efterfrågan och likviditet på tvåsidiga marknaden."
        range={range}
      />

      {metrics.demand.pendingAging > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" strokeWidth={2} />
          <div className="text-[14px]">
            <p className="font-medium text-amber-950">
              {metrics.demand.pendingAging} väntande förfrågningar äldre än 48h
            </p>
            <Link
              href="/admin/bookings"
              className="mt-1 inline-block font-medium text-amber-900 underline underline-offset-2"
            >
              Öppna bokningar
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Talanger"
          value={metrics.supply.providers}
          hint={`${metrics.supply.withPublished} med publicerad tjänst`}
        />
        <MetricTile
          label="Publicerade tjänster"
          value={metrics.supply.publishedServices}
          hint={`${metrics.supply.draftOrPaused} utkast/pausade`}
        />
        <MetricTile
          label="Tjänster med förfrågan"
          value={formatPct(metrics.liquidity.servicesWithRequestPct, 0)}
          hint="Andel publicerade i perioden"
        />
        <MetricTile
          label="Talanger med accept"
          value={formatPct(metrics.liquidity.providersWithAcceptedPct, 0)}
          hint="Andel med ≥1 accepterad bokning"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="text-[16px] font-semibold text-foreground">Efterfrågan</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Förfrågningar i perioden</p>
          <div className="mt-4 space-y-3">
            {metrics.demand.byStatus.map(row => (
              <div key={row.status} className="flex items-center justify-between gap-3">
                <AdminStatusBadge status={row.status} />
                <span className="text-[18px] font-semibold text-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="text-[16px] font-semibold text-foreground">Utbud per kategori</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Publicerade tjänster</p>
          {metrics.byCategory.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted-foreground">Inga publicerade tjänster.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {metrics.byCategory.map(cat => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[13px] font-medium capitalize text-foreground">
                    {cat.category}
                  </span>
                  <div className="h-7 min-w-0 flex-1 overflow-hidden rounded-lg bg-muted">
                    <div
                      className="flex h-full items-center rounded-lg bg-foreground/80 px-2 text-[12px] font-semibold text-background"
                      style={{
                        width: `${Math.max(10, (cat.count / catMax) * 100)}%`,
                      }}
                    >
                      {cat.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-border bg-background/60 p-5">
        <h2 className="text-[16px] font-semibold text-foreground">Betalningar</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          MRR och GMV läggs till när betalningar är live. Tills dess följer vi förfrågningar,
          acceptans och likviditet ovan.
        </p>
      </section>
    </div>
  )
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-[12px] text-muted-foreground">{hint}</p>
    </div>
  )
}
