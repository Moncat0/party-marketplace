import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ServiceWizard from '@/components/service-wizard/ServiceWizard'
import {
  DASHBOARD_WIZARD_PATHS,
  loadWizardFlowService,
} from '@/lib/service-wizard-server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Skapa tjänst' }

type Props = {
  searchParams: { resume?: string; fresh?: string }
}

export default async function NewServiceFlowPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=provider&next=/dashboard/listings/new/flow')

  const paths = DASHBOARD_WIZARD_PATHS
  const service = await loadWizardFlowService(supabase, user.id, {
    resume: searchParams.resume === '1',
    fresh: searchParams.fresh === '1',
    paths,
  })

  return (
    <ServiceWizard
      userId={user.id}
      resume={searchParams.resume === '1'}
      hubPath={paths.hub}
      afterSavePath={paths.afterSave}
      afterPublishPath={paths.afterPublish}
      service={{
        id: service.id,
        title: service.title,
        description: service.description,
        category_slug: service.category_slug,
        category_tags: service.category_tags,
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
