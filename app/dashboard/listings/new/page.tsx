import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizardHub from '@/components/service-wizard/ServiceWizardHub'
import { getServiceForUser } from '@/lib/services'
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

  const result = await getServiceForUser(supabase, user.id)
  const service = result?.service ?? null

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
      service={
        service
          ? {
              id: service.id,
              title: service.title,
              is_published: service.is_published,
              created_at: service.created_at,
            }
          : null
      }
    />
  )
}
