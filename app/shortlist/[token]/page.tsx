import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

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

  const ownerName = (shortlist.users as unknown as { name: string | null } | null)?.name

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-[32px] font-medium leading-[1.125] tracking-[-0.8px] text-[#222222]">
          {ownerName ? `${ownerName}s lista` : 'Delad lista'}
        </h1>
        <p className="text-[14px] text-[#6a6a6a] mt-2">
          {items?.length ?? 0} sparade talanger
        </p>
      </header>

      {!items || items.length === 0 ? (
        <p className="text-center text-[14px] text-[#6a6a6a] py-16">Listan är tom.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8 mb-12">
          {items.map(item => {
            const p = item.provider_profiles as unknown as {
              id: string
              service_title: string | null
              city: string | null
              photos: string[]
              category_tags: string[]
              users: { name: string | null } | null
            } | null
            if (!p) return null
            return (
              <Link key={item.id} href={`/providers/${p.id}`} className="group block">
                <div
                  className="relative aspect-square overflow-hidden bg-[#f2f2f2] mb-3"
                  style={{ borderRadius: 12 }}
                >
                  {p.photos[0] ? (
                    <Image
                      src={p.photos[0]}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width:640px) 100vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl">🎉</div>
                  )}
                </div>
                <p className="font-semibold text-[14px] text-[#222222] truncate">
                  {p.service_title}
                </p>
                {p.users?.name && (
                  <p className="text-[13px] text-[#6a6a6a] truncate">{p.users.name}</p>
                )}
                {p.city && <p className="text-[13px] text-[#6a6a6a]">{p.city}</p>}
              </Link>
            )
          })}
        </div>
      )}

      <div
        className="p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4"
        style={{
          borderRadius: t.rounded.md,
          border: `1px solid ${t.colors.hairline}`,
        }}
      >
        <div className="mb-4 sm:mb-0">
          <p className="text-[16px] font-semibold text-[#222222]">Planerar du också ett kalas?</p>
          <p className="text-[14px] text-[#6a6a6a] mt-1">
            Hitta och spara dina egna favoriter på FESTEN.
          </p>
        </div>
        <Link href="/signup?intent=planner">
          <SettingsButton>Skapa konto gratis</SettingsButton>
        </Link>
      </div>
    </main>
  )
}
