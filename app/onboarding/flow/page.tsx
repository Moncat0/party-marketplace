import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizard from '@/components/service-wizard/ServiceWizard'
import {
  loadWizardFlowService,
  ONBOARDING_WIZARD_PATHS,
} from '@/lib/service-wizard-server'
import { completeSignupUrl, needsTermsAndAge } from '@/lib/auth-compliance'
import { DEFAULT_LOCATION_ID } from '@/lib/locations'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Skapa din tjänst' }

type Props = {
  searchParams: { resume?: string; fresh?: string; id?: string }
}

export default async function OnboardingFlowPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/onboarding/flow')

  const { data: appUser } = await supabase
    .from('users')
    .select(
      'email_verified_at, terms_accepted_at, age_confirmed_at, first_name, last_name, preferred_first_name'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (needsTermsAndAge(appUser)) {
    redirect(completeSignupUrl('/onboarding/flow'))
  }

  const { data: providerProfile } = await supabase
    .from('provider_profiles')
    .select('bio, location_id, city')
    .eq('user_id', user.id)
    .maybeSingle()

  const paths = ONBOARDING_WIZARD_PATHS
  const service = await loadWizardFlowService(supabase, user.id, {
    resume: searchParams.resume === '1',
    fresh: searchParams.fresh === '1',
    serviceId: searchParams.id ?? null,
    paths,
  })

  const preferred =
    appUser?.preferred_first_name?.trim() || appUser?.first_name?.trim() || ''
  const basedInLocationId =
    providerProfile?.location_id?.trim() || DEFAULT_LOCATION_ID

  return (
    <ServiceWizard
      userId={user.id}
      resume={searchParams.resume === '1'}
      hubPath={paths.hub}
      afterSavePath={paths.afterSave}
      afterPublishPath={paths.afterPublish}
      firstBackPath={paths.afterSave}
      includeAccountSteps
      accountNeedsName={!preferred}
      accountNeedsBio={!providerProfile?.bio?.trim()}
      accountNeedsBasedIn={!providerProfile?.location_id?.trim()}
      initialAccount={{
        firstName: preferred,
        lastName: appUser?.last_name?.trim() || '',
        bio: providerProfile?.bio ?? '',
        basedInLocationId,
      }}
      emailVerified={!!appUser?.email_verified_at}
      service={{
        id: service.id,
        title: service.title,
        description: service.description,
        category_slug: service.category_slug,
        category_tags: service.category_tags,
        occasions: service.occasions ?? [],
        location_id: service.location_id,
        photos: service.photos ?? [],
        price_range_min: service.price_range_min,
        price_range_max: service.price_range_max,
        can_travel: service.can_travel ?? false,
        is_published: service.is_published,
        created_at: service.created_at,
      }}
    />
  )
}
