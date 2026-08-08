import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GuestAppChrome from '@/components/GuestAppChrome'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mina recensioner' }

export default async function PlannerReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewee_id, booking_request_id, users!reviewee_id(name)')
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <GuestAppChrome>
      <header className="mb-8">
        <h1 className="text-[32px] font-medium leading-[1.125] tracking-[-0.8px] text-[#222222]">
          Mina recensioner
        </h1>
        <p className="text-[14px] text-[#6a6a6a] mt-2">
          {reviews?.length ?? 0} {(reviews?.length ?? 0) === 1 ? 'recension' : 'recensioner'} skrivna
        </p>
      </header>

      {!reviews?.length ? (
        <div className="py-16 text-center">
          <p className="text-[16px] font-medium text-[#222222] mb-2">Inga recensioner än</p>
          <p className="text-[14px] text-[#6a6a6a] mb-6">
            De dyker upp här efter att du har bokat och lämnat ett omdöme.
          </p>
          <Link href="/">
            <SettingsButton>Hitta underhållning →</SettingsButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map(review => {
            const reviewee = (
              Array.isArray(review.users) ? review.users[0] : review.users
            ) as { name: string | null } | null
            return (
              <div
                key={review.id}
                className="p-5 bg-white"
                style={{ borderRadius: t.rounded.md, border: `1px solid ${t.colors.hairline}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#222222]">
                      {reviewee?.name ?? 'Talang'}
                    </p>
                    <p className="text-[12px] text-[#6a6a6a] mt-0.5">
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
                        fill={i < review.rating ? '#FF2E8A' : 'none'}
                        stroke="#FF2E8A"
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-[14px] text-[#6a6a6a] leading-relaxed">{review.comment}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </GuestAppChrome>
  )
}
