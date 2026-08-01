import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin — Talanger' }
export const dynamic = 'force-dynamic'

export default async function AdminProvidersPage() {
  const supabase = createAdminClient()
  const { data: providers } = await supabase
    .from('provider_profiles')
    .select(
      'id, city, created_at, users!user_id(name, email), services(id, title, category_tags, is_published, is_disabled)'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <AdminPageHeader
        title="Talanger"
        description={`${providers?.length ?? 0} senaste (max 200)`}
      />

      {!providers || providers.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga talanger ännu.</p>
      ) : (
        <div className="space-y-2">
          {providers.map(p => {
            const users = Array.isArray(p.users) ? p.users[0] : p.users
            const services = Array.isArray(p.services) ? p.services : []
            const live = services.find(
              (s: { is_published?: boolean; is_disabled?: boolean }) =>
                s.is_published && !s.is_disabled
            )
            const service = live ?? services[0]
            const publishedCount = services.filter(
              (s: { is_published?: boolean; is_disabled?: boolean }) =>
                s.is_published && !s.is_disabled
            ).length

            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {service?.title ?? 'Ingen tjänst'}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {(users as { name?: string | null; email?: string | null } | null)?.name ??
                      '—'}{' '}
                    ·{' '}
                    {(users as { email?: string | null } | null)?.email ?? '—'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {p.city ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                        <MapPin className="size-3" strokeWidth={2} aria-hidden />
                        {p.city}
                      </span>
                    ) : null}
                    <Badge variant="secondary" className="rounded-full font-normal">
                      {publishedCount} publicerad{publishedCount === 1 ? '' : 'e'}
                    </Badge>
                    {(service?.category_tags as string[] | undefined)?.slice(0, 2).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {service?.id ? (
                    <Link
                      href={`/tjanster/${service.id}`}
                      target="_blank"
                      className="text-[13px] font-medium text-primary hover:underline"
                    >
                      Visa
                    </Link>
                  ) : null}
                  <span className="text-[12px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
