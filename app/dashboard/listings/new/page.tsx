import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizardHub from '@/components/service-wizard/ServiceWizardHub'
import { getServicesForUser } from '@/lib/services'
import { ensureUserIsProvider } from '@/lib/service-wizard-server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ny tjänst' }

export default async function NewServiceHubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard/listings/new')

  await ensureUserIsProvider(supabase, user.id)

  const result = await getServicesForUser(supabase, user.id)
  const services = result?.services ?? []

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const fullName =
    profile?.name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
  const firstName = fullName.trim().split(/\s+/)[0] ?? ''

  return (
    <ServiceWizardHub
      mode="dashboard"
      basePath="/dashboard/listings/new"
      firstName={firstName}
      services={services.map(s => ({
        id: s.id,
        title: s.title,
        is_published: s.is_published,
        created_at: s.created_at,
      }))}
    />
  )
}
