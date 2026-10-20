import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'

export const metadata = { title: 'Admin — Betalningar' }
export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      'id, status, payment_status, price_ore, platform_fee_ore, provider_payout_ore, created_at, stripe_payment_intent_id, users!planner_id(name, email), services!service_id(title)'
    )
    .not('payment_status', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  const totalGmvOre = bookings?.reduce((s, b) => s + (b.price_ore ?? 0), 0) ?? 0
  const totalFeeOre = bookings?.reduce((s, b) => s + (b.platform_fee_ore ?? 0), 0) ?? 0

  function fmt(ore: number | null) {
    if (!ore) return '—'
    return (ore / 100).toLocaleString('sv-SE') + ' kr'
  }

  return (
    <div>
      <AdminPageHeader
        title="Betalningar"
        description={`${bookings?.length ?? 0} transaktioner`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tile label="GMV" value={fmt(totalGmvOre)} />
        <Tile label="Gigtorget-avgift" value={fmt(totalFeeOre)} />
        <Tile label="Transaktioner" value={String(bookings?.length ?? 0)} />
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga betalningar ännu.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => {
            const planner = Array.isArray(b.users) ? b.users[0] : b.users
            const service = Array.isArray(b.services) ? b.services[0] : b.services
            return (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {(planner as { name?: string | null } | null)?.name ?? 'Okänd'} →{' '}
                    {(service as { title?: string | null } | null)?.title ?? 'Okänd'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {b.payment_status} · {new Date(b.created_at).toLocaleDateString('sv-SE')}
                  </p>
                  {b.stripe_payment_intent_id ? (
                    <p className="font-mono text-[11px] text-muted-foreground/60">
                      {b.stripe_payment_intent_id}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-semibold text-foreground">{fmt(b.price_ore)}</p>
                  {b.platform_fee_ore ? (
                    <p className="text-[11px] text-muted-foreground">
                      Avgift: {fmt(b.platform_fee_ore)}
                    </p>
                  ) : null}
                  {b.provider_payout_ore ? (
                    <p className="text-[11px] text-muted-foreground">
                      Utbetalning: {fmt(b.provider_payout_ore)}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}
