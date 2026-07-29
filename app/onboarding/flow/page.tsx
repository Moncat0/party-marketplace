import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizard from '@/components/service-wizard/ServiceWizard'
import {
  loadWizardFlowService,
  ONBOARDING_WIZARD_PATHS,
} from '@/lib/service-wizard-server'
import { needsPasswordSetup, setPasswordUrl } from '@/lib/auth-password'

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

  if (needsPasswordSetup(user)) {
    redirect(setPasswordUrl('/onboarding/flow'))
  }
  const paths = ONBOARDING_WIZARD_PATHS
  const service = await loadWizardFlowService(supabase, user.id, {
    resume: searchParams.resume === '1',
    fresh: searchParams.fresh === '1',
    serviceId: searchParams.id ?? null,
    paths,
  })

  const [{ data: appUser }, { data: provider }] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, last_name, name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('provider_profiles')
      .select('bio')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  let firstName = appUser?.first_name?.trim() ?? ''
  let lastName = appUser?.last_name?.trim() ?? ''
  if (!firstName && appUser?.name) {
    const parts = appUser.name.trim().split(/\s+/)
    firstName = parts[0] ?? ''
    lastName = lastName || parts.slice(1).join(' ')
  }
  if (!firstName) {
    const meta =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      ''
    if (meta.trim()) {
      const parts = meta.trim().split(/\s+/)
      firstName = parts[0] ?? ''
      lastName = lastName || parts.slice(1).join(' ')
    }
  }

  return (
    <ServiceWizard
      userId={user.id}
      resume={searchParams.resume === '1'}
      hubPath={paths.hub}
      afterSavePath={paths.afterSave}
      afterPublishPath={paths.afterPublish}
      firstBackPath={paths.afterSave}
      includeAccountSteps
      accountNeedsName={!(appUser?.first_name ?? '').trim()}
      accountNeedsBio={!(provider?.bio ?? '').trim()}
      initialAccount={{
        firstName,
        lastName,
        bio: provider?.bio ?? '',
      }}
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
        is_published: service.is_published,
        created_at: service.created_at,
      }}
    />
  )
}
