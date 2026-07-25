import { createAdminClient } from '@/lib/supabase-admin'

export const metadata = { title: 'Admin — Användare' }

const typeLabels: Record<string, string> = {
  planner: 'Planerare',
  provider: 'Talang',
}

export default async function AdminUsersPage() {
  const supabase = createAdminClient()
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, user_type, auth_provider, signup_source, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#222222]">Användare</h1>
        <span className="text-sm text-[#6A6A6A]">{users?.length ?? 0} totalt</span>
      </div>

      {!users || users.length === 0 ? (
        <p className="text-sm text-[#6A6A6A]">Inga användare ännu.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="rounded-xl bg-white p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#222222] truncate">{u.name ?? 'Inget namn'}</p>
                <p className="text-xs text-[#6A6A6A] truncate">{u.email ?? '—'}</p>
                <p className="text-xs text-[#6A6A6A] mt-0.5">
                  {u.auth_provider ?? '—'} · {u.signup_source ?? 'organic'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.user_type === 'provider'
                    ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                    : 'bg-[#222222]/10 text-[#222222]'
                }`}>
                  {typeLabels[u.user_type] ?? u.user_type}
                </span>
                <span className="text-xs text-[#6A6A6A]">
                  {new Date(u.created_at).toLocaleDateString('sv-SE')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
