import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServicesForUser } from '@/lib/services'

export type ProviderShellData = {
  userId: string
  name: string | null
  profileId: string
  serviceId: string | null
  serviceIds: string[]
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
    getServicesForUser(supabase, user.id),
  ])

  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceIds = result.services.map(s => s.id)
  const serviceId = serviceIds[0] ?? null

  const [{ count: pendingRequests }, { data: bookingIds }] = serviceIds.length
    ? await Promise.all([
        supabase
          .from('booking_requests')
          .select('*', { count: 'exact', head: true })
          .in('service_id', serviceIds)
          .eq('status', 'pending'),
        supabase
          .from('booking_requests')
          .select('id')
          .in('service_id', serviceIds)
          .in('status', ['accepted', 'completed']),
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
    serviceIds,
    pendingRequests: pendingRequests ?? 0,
    unreadMessages: unreadMessages ?? 0,
  }
}
