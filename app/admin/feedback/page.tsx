import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export const metadata = { title: 'Admin — Feedback' }
export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  const supabase = createAdminClient()
  const { data: items } = await supabase
    .from('feedback')
    .select('id, message, page_url, created_at, users!user_id(name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <AdminPageHeader
        title="Feedback"
        description={`${items?.length ?? 0} senaste (max 200)`}
      />

      {!items || items.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Ingen feedback ännu.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const user = Array.isArray(item.users) ? item.users[0] : item.users
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {(user as { name?: string | null } | null)?.name ?? 'Anonym'}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {(user as { email?: string | null } | null)?.email ?? '—'}
                      {item.page_url ? ` · ${item.page_url}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('sv-SE')}
                  </span>
                </div>
                <p className="text-[14px] leading-relaxed text-foreground">{item.message}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
