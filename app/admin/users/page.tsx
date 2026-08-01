import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import AdminUsersFilters from '@/components/admin/AdminUsersFilters'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin — Användare' }
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: {
    q?: string
    type?: string
    status?: string
    auth?: string
  }
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const supabase = createAdminClient()
  const q = (searchParams.q ?? '').trim()
  const type = searchParams.type ?? ''
  const status = searchParams.status ?? ''
  const auth = searchParams.auth ?? ''

  let query = supabase
    .from('users')
    .select(
      'id, name, email, user_type, auth_provider, signup_source, created_at, deactivated_at, phone, preferred_first_name, first_name'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (type === 'planner' || type === 'provider' || type === 'both') {
    query = query.eq('user_type', type)
  }
  if (auth) {
    query = query.eq('auth_provider', auth)
  }
  if (status === 'active') {
    query = query.is('deactivated_at', null)
  } else if (status === 'deactivated') {
    query = query.not('deactivated_at', 'is', null)
  }
  if (q) {
    // PostgREST or() — search name / email / phone
    const escaped = q.replace(/[%_,]/g, '')
    query = query.or(
      `email.ilike.%${escaped}%,name.ilike.%${escaped}%,first_name.ilike.%${escaped}%,preferred_first_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`
    )
  }

  const { data: users } = await query

  return (
    <div>
      <AdminPageHeader
        title="Användare"
        description={`${users?.length ?? 0} träffar (max 200) · klicka för detaljer`}
      />

      <Suspense fallback={null}>
        <AdminUsersFilters />
      </Suspense>

      {!users || users.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga användare matchar filtren.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const display =
              u.name ||
              [u.first_name, u.preferred_first_name].filter(Boolean)[0] ||
              'Inget namn'
            return (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {display}
                    </p>
                    {u.deactivated_at ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full border-transparent bg-amber-100 font-medium text-amber-900"
                      >
                        Inaktiverad
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {u.email ?? '—'}
                    {u.phone ? ` · ${u.phone}` : ''}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {u.auth_provider ?? '—'} · {u.signup_source ?? 'organic'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <AdminStatusBadge status={u.user_type ?? 'planner'} />
                  <span className="text-[12px] text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
