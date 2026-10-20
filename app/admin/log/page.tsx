import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export const metadata = { title: 'Admin — Händelselogg' }
export const dynamic = 'force-dynamic'

export default async function AdminLogPage() {
  const supabase = createAdminClient()
  const { data: logs } = await supabase
    .from('admin_logs')
    .select('id, admin_email, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div>
      <AdminPageHeader
        title="Händelselogg"
        description={`${logs?.length ?? 0} senaste (max 500)`}
      />

      {!logs || logs.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga loggade händelser ännu.</p>
      ) : (
        <div className="space-y-1">
          {logs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-4 rounded-xl border border-border/50 bg-background px-4 py-2.5"
            >
              <span className="shrink-0 text-[12px] text-muted-foreground">
                {new Date(log.created_at).toLocaleString('sv-SE')}
              </span>
              <p className="text-[13px] text-foreground">
                <span className="font-medium">{log.admin_email ?? 'Admin'}</span>
                {' — '}
                <span>{log.action}</span>
                {log.target_type && log.target_id ? (
                  <span className="text-muted-foreground">
                    {' '}({log.target_type}: <code className="font-mono text-[11px]">{log.target_id.slice(0, 8)}…</code>)
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
