import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizardHub from '@/components/service-wizard/ServiceWizardHub'
import { ensureProviderAndService, getServicesForUser } from '@/lib/services'
import {
  ensureUserIsProvider,
  ONBOARDING_WIZARD_PATHS,
  serviceHasProgress,
} from '@/lib/service-wizard-server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Skapa din tjänst' }

/**
 * Provider onboarding hub — reuses the Airbnb-style service wizard.
 * Brand-new providers go straight into the flow; drafts land on this hub.
 */
export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?intent=provider&next=/onboarding')
  }

  await ensureUserIsProvider(supabase, user.id)

  const ensured = await ensureProviderAndService(supabase, user.id)
  if (ensured.error) {
    redirect('/')
  }

  const result = await getServicesForUser(supabase, user.id)
  const services = result?.services ?? []
  const primary = services[0] ?? null

  if (primary?.is_published) {
    redirect(ONBOARDING_WIZARD_PATHS.afterPublish)
  }

  // First-time: skip hub, start wizard immediately
  if (!serviceHasProgress(primary)) {
    redirect(ONBOARDING_WIZARD_PATHS.flow)
  }

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
      mode="onboarding"
      basePath="/onboarding"
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
