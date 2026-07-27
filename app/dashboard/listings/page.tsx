import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import ListingsClient from '@/components/dashboard/ListingsClient'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServicesForUser } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tjänster' }

export default async function ListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const result = await getServicesForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  return (
    <ProviderHostShell wide>
      <ListingsClient
        listings={result.services.map(service => ({
          id: service.id,
          title: service.title,
          city: service.city,
          category_slug: service.category_slug,
          category_tags: service.category_tags,
          photos: service.photos,
          is_published: service.is_published,
          is_disabled: service.is_disabled,
          created_at: service.created_at,
        }))}
      />
    </ProviderHostShell>
  )
}
