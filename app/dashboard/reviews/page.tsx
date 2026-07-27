import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import { settingsTokens as t } from '@/components/settings/tokens'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServiceForUser } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Recensioner' }

export default async function ReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const result = await getServiceForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceId = result.service?.id ?? null

  const { data: reviews } = serviceId
    ? await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, users!reviewer_id(name)')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false })
    : { data: [] }

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <ProviderHostShell>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-[32px] font-medium leading-[1.125] tracking-[-0.8px]" style={{ color: t.colors.ink }}>
            Recensioner
          </h1>
          {reviews && reviews.length > 0 && (
            <p className="mt-2 text-[14px]" style={{ color: t.colors.muted }}>
              {reviews.length} {reviews.length === 1 ? 'recension' : 'recensioner'}
            </p>
          )}
        </div>

        {avgRating !== null && (
          <div
            className="mb-6 flex items-center gap-8 px-8 py-6"
            style={{ borderRadius: t.rounded.md, background: t.colors.ink }}
          >
            <div className="text-center">
              <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
              <div className="mt-1 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(avgRating) ? t.colors.primary : 'none'}
                    stroke={t.colors.primary}
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <p className="text-sm text-white/60">
              Snittbetyg av {reviews!.length}{' '}
              {reviews!.length === 1 ? 'recension' : 'recensioner'}
            </p>
          </div>
        )}

        {!reviews || reviews.length === 0 ? (
          <div
            className="bg-white py-20 text-center"
            style={{ borderRadius: t.rounded.md, border: `1px solid ${t.colors.hairline}` }}
          >
            <p className="mb-2 text-base font-semibold" style={{ color: t.colors.ink }}>
              Inga recensioner ännu
            </p>
            <p className="text-sm" style={{ color: t.colors.muted }}>
              Recensioner visas här när kunder har betygsatt dig.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.map(review => {
              const reviewer = (
                Array.isArray(review.users) ? review.users[0] : review.users
              ) as { name: string | null } | null
              return (
                <div
                  key={review.id}
                  className="bg-white p-5"
                  style={{ borderRadius: t.rounded.md, border: `1px solid ${t.colors.hairline}` }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: t.colors.ink }}>
                        {reviewer?.name ?? 'Anonym'}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: t.colors.muted }}>
                        {new Date(review.created_at).toLocaleDateString('sv-SE', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={i < review.rating ? t.colors.primary : 'none'}
                          stroke={t.colors.primary}
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p
                      className="border-l-2 pl-3 text-sm leading-relaxed"
                      style={{ color: t.colors.muted, borderColor: t.colors.hairlineSoft }}
                    >
                      {review.comment}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ProviderHostShell>
  )
}
