import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizard from '@/components/service-wizard/ServiceWizard'
import {
  loadWizardFlowService,
  ONBOARDING_WIZARD_PATHS,
} from '@/lib/service-wizard-server'

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

  const paths = ONBOARDING_WIZARD_PATHS
  const service = await loadWizardFlowService(supabase, user.id, {
    resume: searchParams.resume === '1',
    fresh: searchParams.fresh === '1',
    serviceId: searchParams.id ?? null,
    paths,
  })

  return (
    <ServiceWizard
      userId={user.id}
      resume={searchParams.resume === '1'}
      hubPath={paths.hub}
      afterSavePath={paths.afterSave}
      afterPublishPath={paths.afterPublish}
      firstBackPath={paths.afterSave}
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
