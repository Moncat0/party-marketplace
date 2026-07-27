import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizardHub from '@/components/service-wizard/ServiceWizardHub'
import { ensureProviderAndService, getServiceForUser } from '@/lib/services'
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
    redirect('/planner/dashboard')
  }

  const result = await getServiceForUser(supabase, user.id)
  const service = result?.service ?? null

  if (service?.is_published) {
    redirect(ONBOARDING_WIZARD_PATHS.afterPublish)
  }

  // First-time: skip hub, start wizard immediately
  if (!serviceHasProgress(service)) {
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
