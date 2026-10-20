import { Mail, UserCheck, Megaphone } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin — Inbjudningar' }
export const dynamic = 'force-dynamic'

type InviteRow = {
  email: string
  invitedBy: string[]
  sentAt: string
  userId: string | null
  userName: string | null
  signedUpAt: string | null
  publishedAt: string | null
  status: 'published' | 'signed_up' | 'invited'
}

export default async function AdminInvitesPage() {
  const supabase = createAdminClient()

  // 1. All invite events — get email + who sent it + when
  const { data: events } = await supabase
    .from('tracking_events')
    .select('properties, user_id, created_at, users!user_id(name, email)')
    .eq('event_name', 'provider_nominated')
    .order('created_at', { ascending: false })
    .limit(1000)

  // Build map: nominated_email -> { inviters, first sent }
  const byEmail = new Map<string, { inviters: string[]; sentAt: string }>()
  for (const ev of events ?? []) {
    const nominatedEmail = (ev.properties as Record<string, string> | null)?.nominated_email
    if (!nominatedEmail) continue
    const normalized = nominatedEmail.toLowerCase().trim()
    const inviterUser = Array.isArray(ev.users) ? ev.users[0] : ev.users
    const inviterLabel =
      (inviterUser as { name?: string | null; email?: string | null } | null)?.name ??
      (inviterUser as { email?: string | null } | null)?.email ??
      'Okänd'
    const existing = byEmail.get(normalized)
    if (existing) {
      if (!existing.inviters.includes(inviterLabel)) existing.inviters.push(inviterLabel)
    } else {
      byEmail.set(normalized, { inviters: [inviterLabel], sentAt: ev.created_at })
    }
  }

  const invitedEmails = Array.from(byEmail.keys())

  // 2. Users who signed up with any of those emails
  const { data: matchedUsers } =
    invitedEmails.length > 0
      ? await supabase
          .from('users')
          .select('id, email, name, created_at')
          .in('email', invitedEmails)
      : { data: [] }

  const userByEmail = new Map(
    (matchedUsers ?? []).map(u => [u.email?.toLowerCase().trim() ?? '', u])
  )

  // 3. Check which of those users have a published service
  const userIds = (matchedUsers ?? []).map(u => u.id)
  const publishedProviderUserIds = new Set<string>()
  const publishedAtByUserId = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: pubProfiles } = await supabase
      .from('provider_profiles')
      .select('user_id, services(id, is_published, is_disabled, created_at)')
      .in('user_id', userIds)

    for (const pp of pubProfiles ?? []) {
      const services = Array.isArray(pp.services) ? pp.services : []
      const firstPublished = services
        .filter(
          (s: { is_published?: boolean; is_disabled?: boolean; created_at?: string }) =>
            s.is_published && !s.is_disabled
        )
        .sort(
          (
            a: { created_at?: string },
            b: { created_at?: string }
          ) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
        )[0]
      if (firstPublished) {
        publishedProviderUserIds.add(pp.user_id)
        publishedAtByUserId.set(pp.user_id, (firstPublished as { created_at?: string }).created_at ?? '')
      }
    }
  }

  // 4. Build rows
  const rows: InviteRow[] = Array.from(byEmail.entries()).map(([email, meta]) => {
    const user = userByEmail.get(email) ?? null
    const published = user ? publishedProviderUserIds.has(user.id) : false
    return {
      email,
      invitedBy: meta.inviters,
      sentAt: meta.sentAt,
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      signedUpAt: user?.created_at ?? null,
      publishedAt: published && user ? (publishedAtByUserId.get(user.id) ?? null) : null,
      status: published ? 'published' : user ? 'signed_up' : 'invited',
    }
  })

  // Sort: published first, then signed_up, then invited; within each group by sentAt desc
  const order = { published: 0, signed_up: 1, invited: 2 }
  rows.sort((a, b) => order[a.status] - order[b.status] || new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())

  const totalInvited = rows.length
  const totalSignedUp = rows.filter(r => r.status !== 'invited').length
  const totalPublished = rows.filter(r => r.status === 'published').length

  return (
    <div>
      <AdminPageHeader
        title="Inbjudningar"
        description={`${totalInvited} inbjudna · ${totalSignedUp} registrerade · ${totalPublished} publicerade`}
      />

      {/* Funnel tiles */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" strokeWidth={2} />
            <p className="text-[12px] font-medium text-muted-foreground">Inbjudna</p>
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-foreground">{totalInvited}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Unika e-postadresser</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2">
            <UserCheck className="size-4 text-muted-foreground" strokeWidth={2} />
            <p className="text-[12px] font-medium text-muted-foreground">Registrerade</p>
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-foreground">{totalSignedUp}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {totalInvited > 0 ? `${Math.round((totalSignedUp / totalInvited) * 100)}% av inbjudna` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2">
            <Megaphone className="size-4 text-muted-foreground" strokeWidth={2} />
            <p className="text-[12px] font-medium text-muted-foreground">Publicerade</p>
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-foreground">{totalPublished}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {totalSignedUp > 0 ? `${Math.round((totalPublished / totalSignedUp) * 100)}% av registrerade` : '—'}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga inbjudningar skickade ännu.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <div
              key={row.email}
              className="rounded-2xl border border-border bg-background px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-foreground">
                      {row.userName ? `${row.userName}` : row.email}
                    </p>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {row.userName ? row.email : null}
                    {row.userName ? ' · ' : null}
                    Inbjuden av {row.invitedBy.slice(0, 2).join(', ')}
                    {row.invitedBy.length > 2 ? ` +${row.invitedBy.length - 2}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-[12px] text-muted-foreground">
                  <span>Skickad {new Date(row.sentAt).toLocaleDateString('sv-SE')}</span>
                  {row.signedUpAt ? (
                    <span>Registrerad {new Date(row.signedUpAt).toLocaleDateString('sv-SE')}</span>
                  ) : null}
                  {row.publishedAt ? (
                    <span>Publicerad {new Date(row.publishedAt).toLocaleDateString('sv-SE')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: InviteRow['status'] }) {
  if (status === 'published') {
    return (
      <Badge className="rounded-full border-transparent bg-[#1D9E75]/10 font-medium text-[#1D9E75] hover:bg-[#1D9E75]/10">
        Publicerad
      </Badge>
    )
  }
  if (status === 'signed_up') {
    return (
      <Badge className="rounded-full border-transparent bg-blue-100 font-medium text-blue-800 hover:bg-blue-100">
        Registrerad
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="rounded-full font-medium text-muted-foreground">
      Inbjuden
    </Badge>
  )
}
