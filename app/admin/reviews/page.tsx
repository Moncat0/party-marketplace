import { Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export const metadata = { title: 'Admin — Recensioner' }
export const dynamic = 'force-dynamic'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-primary" aria-label={`${rating} av 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="size-3.5"
          strokeWidth={2}
          fill={i < rating ? 'currentColor' : 'none'}
          aria-hidden
        />
      ))}
    </span>
  )
}

export default async function AdminReviewsPage() {
  const supabase = createAdminClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      'id, rating, comment, created_at, users!reviewer_id(name, email), services!service_id(title)'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <AdminPageHeader
        title="Recensioner"
        description={`${reviews?.length ?? 0} senaste (max 200)`}
      />

      {!reviews || reviews.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">Inga recensioner ännu.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map(r => {
            const users = Array.isArray(r.users) ? r.users[0] : r.users
            const services = Array.isArray(r.services) ? r.services[0] : r.services
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-foreground">
                      {(users as { name?: string | null } | null)?.name ?? 'Anonym'} →{' '}
                      {(services as { title?: string | null } | null)?.title ?? 'Okänd'}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {(users as { email?: string | null } | null)?.email ?? '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Stars rating={r.rating} />
                    <span className="text-[12px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                </div>
                {r.comment ? (
                  <p className="mt-2 border-l-2 border-border pl-3 text-[14px] leading-relaxed text-muted-foreground">
                    {r.comment}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
