import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function SharedShortlistPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()

  const { data: shortlist } = await supabase
    .from('shortlists')
    .select('id, planner_id, users(name)')
    .eq('share_token', params.token)
    .single()

  if (!shortlist) notFound()

  const { data: items } = await supabase
    .from('shortlist_items')
    .select('id, provider_profiles(id, service_title, city, photos, category_tags, users(name))')
    .eq('shortlist_id', shortlist.id)
    .order('added_at', { ascending: false })

  const ownerName = (shortlist.users as { name: string | null } | null)?.name

  return (
    <main className="min-h-screen bg-[#FFF8F3] px-4 py-10">
      <div className="mx-auto max-w-sm">

        {/* Header */}
        <div className="mb-2 text-center">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">FESTEN.</h1>
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-[#1A1A2E]">
            {ownerName ? `${ownerName}s lista` : 'Delad lista'}
          </h2>
          <p className="text-sm text-[#5F5E5A]">{items?.length ?? 0} sparade talanger</p>
        </div>

        {/* Provider cards */}
        {!items || items.length === 0 ? (
          <p className="text-center text-sm text-[#5F5E5A] py-10">Listan är tom.</p>
        ) : (
          <div className="space-y-3 mb-8">
            {items.map(item => {
              const p = item.provider_profiles as {
                id: string
                service_title: string | null
                city: string | null
                photos: string[]
                category_tags: string[]
                users: { name: string | null } | null
              } | null
              if (!p) return null
              return (
                <Link
                  key={item.id}
                  href={`/providers/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm hover:bg-[#F0EDE8] transition-colors"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0EDE8]">
                    {p.photos[0] ? (
                      <Image src={p.photos[0]} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xl">🎉</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#1A1A2E] truncate">{p.service_title}</p>
                    {p.users?.name && (
                      <p className="text-xs text-[#5F5E5A] truncate">{p.users.name}</p>
                    )}
                    {p.city && <p className="text-xs text-[#5F5E5A]">📍 {p.city}</p>}
                  </div>
                  <span className="ml-auto text-[#FF6B35] flex-shrink-0">→</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#1A1A2E] mb-1">Planerar du också ett kalas?</p>
          <p className="text-xs text-[#5F5E5A] mb-4">Hitta och spara dina egna favoriter på FESTEN.</p>
          <Link
            href="/signup"
            className="block w-full rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
          >
            Skapa konto gratis
          </Link>
        </div>

      </div>
    </main>
  )
}
