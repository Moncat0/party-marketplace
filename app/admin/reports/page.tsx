import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminReportActions from '@/components/admin/AdminReportActions'

export const metadata = { title: 'Admin — Anmälningar' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  open: 'Öppen',
  resolved: 'Hanterad',
  dismissed: 'Avvisad',
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient()
  const { data: reports } = await supabase
    .from('reports')
    .select('id, target_type, target_id, reason, details, status, created_at, users!reporter_id(name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  const openCount = reports?.filter(r => r.status === 'open').length ?? 0

  return (
    <div>
      <AdminPageHeader
        title="Anmälningar"
        description={`${openCount} öppna · ${reports?.length ?? 0} totalt`}
      />

      {!reports || reports.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga anmälningar ännu.</p>
      ) : (
        <div className="space-y-2">
          {reports.map(r => {
            const reporter = Array.isArray(r.users) ? r.users[0] : r.users
            return (
              <div
                key={r.id}
                className={`rounded-2xl border bg-background px-4 py-3 ${r.status === 'open' ? 'border-amber-200' : 'border-border/50 opacity-60'}`}
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">
                      {r.reason}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Av: {(reporter as { name?: string | null } | null)?.name ?? 'Anonym'}
                      {' · '}
                      {r.target_type}: <code className="font-mono text-[11px]">{r.target_id?.slice(0, 8)}…</code>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${r.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                {r.details ? (
                  <p className="mt-1 text-[13px] text-muted-foreground">{r.details}</p>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('sv-SE')}
                  </span>
                  {r.status === 'open' ? (
                    <AdminReportActions reportId={r.id} />
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
