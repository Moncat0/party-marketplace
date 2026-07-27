import { createAdminClient } from '@/lib/supabase-admin'

export const metadata = { title: 'Admin — Recensioner' }

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm text-[#FF6B35]">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default async function AdminReviewsPage() {
  const supabase = createAdminClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users!reviewer_id(name, email), services!service_id(title)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#222222]">Recensioner</h1>
        <span className="text-sm text-[#6A6A6A]">{reviews?.length ?? 0} totalt</span>
      </div>

      {!reviews || reviews.length === 0 ? (
        <p className="text-sm text-[#6A6A6A]">Inga recensioner ännu.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r: any) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#222222] truncate">
                    {r.users?.name ?? 'Anonym'} → {r.services?.title ?? 'Okänd'}
                  </p>
                  <p className="text-xs text-[#6A6A6A] truncate">{r.users?.email ?? '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-[#6A6A6A]">
                    {new Date(r.created_at).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-[#6A6A6A] leading-relaxed border-l-2 border-[#DDDDDD] pl-3">
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
