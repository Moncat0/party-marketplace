import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import ProviderHostShell from '@/components/dashboard/ProviderHostShell'
import EditListingForm from './EditListingForm'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServiceByIdForProvider } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Redigera tjänst' }

type Props = {
  params: { id: string }
}

export default async function EditListingPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/signup?intent=provider&next=/dashboard/listings/${params.id}/edit`)

  const { data: existingProvider } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingProvider) return await redirectWithoutProviderProfile(supabase, user.id)

  const service = await getServiceByIdForProvider(supabase, existingProvider.id, params.id)
  if (!service) notFound()

  return (
    <ProviderHostShell>
      <EditListingForm service={service} userId={user.id} />
    </ProviderHostShell>
  )
}
