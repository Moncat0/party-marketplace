import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ShortlistView from './ShortlistView'

export default async function ShortlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signup?next=/planner/shortlist')

  const { data: shortlist } = await supabase
    .from('shortlists')
    .select('id, share_token')
    .eq('planner_id', user.id)
    .single()

  if (!shortlist) {
    return (
      <main className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center px-4">
        <p className="text-4xl mb-4">♡</p>
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Din lista är tom</h1>
        <p className="text-sm text-[#5F5E5A] text-center mb-6">
          Spara talanger du gillar så dyker de upp här.
        </p>
        <a
          href="/"
          className="rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
        >
          Hitta talanger
        </a>
      </main>
    )
  }

  const { data: items } = await supabase
    .from('shortlist_items')
    .select('id, provider_profile_id, provider_profiles(id, service_title, city, photos, category_tags, user_id, users(name))')
    .eq('shortlist_id', shortlist.id)
    .order('added_at', { ascending: false })

  return (
    <ShortlistView
      shortlistId={shortlist.id}
      shareToken={shortlist.share_token}
      items={items ?? []}
    />
  )
}
