import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServiceForUser } from '@/lib/services'

export type ProviderShellData = {
  userId: string
  name: string | null
  profileId: string
  serviceId: string | null
  pendingRequests: number
  unreadMessages: number
}

/** Auth + badge counts for the provider dashboard chrome. */
export async function loadProviderShellData(): Promise<ProviderShellData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const [{ data: userData }, result] = await Promise.all([
    supabase.from('users').select('name').eq('id', user.id).single(),
    getServiceForUser(supabase, user.id),
  ])

  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceId = result.service?.id ?? null

  const [{ count: pendingRequests }, { data: bookingIds }] = serviceId
    ? await Promise.all([
        supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', serviceId)
          .eq('status', 'pending'),
        supabase.from('booking_requests').select('id').eq('service_id', serviceId),
      ])
    : [{ count: 0 }, { data: [] }]

  const requestIds = (bookingIds ?? []).map(r => r.id)
  const { count: unreadMessages } =
    requestIds.length > 0
      ? await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .is('read_at', null)
          .neq('sender_id', user.id)
          .in('booking_request_id', requestIds)
      : { count: 0 }

  return {
    userId: user.id,
    name: userData?.name ?? null,
    profileId: result.provider.id,
    serviceId,
    pendingRequests: pendingRequests ?? 0,
    unreadMessages: unreadMessages ?? 0,
  }
}
