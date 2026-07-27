import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/AccountLayout'
import YourPaymentsView, { type PaymentRow } from '@/components/settings/YourPaymentsView'
import { redirectWithoutProviderProfile } from '@/lib/require-provider-profile'
import { getServiceForUser } from '@/lib/services'

export const metadata = { title: 'Dina betalningar' }
export const dynamic = 'force-dynamic'

export default async function ProviderPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup?intent=planner')

  const result = await getServiceForUser(supabase, user.id)
  if (!result) return await redirectWithoutProviderProfile(supabase, user.id)

  const serviceId = result.service?.id ?? null

  const { data: bookings } = serviceId
    ? await supabase
        .from('booking_requests')
        .select('id, event_date, price_ore, payment_status, users!planner_id(name)')
        .eq('service_id', serviceId)
        .not('payment_status', 'is', null)
        .order('created_at', { ascending: false })
    : { data: [] }

  const payments: PaymentRow[] = (bookings ?? []).map(b => {
    const planner = (Array.isArray(b.users) ? b.users[0] : b.users) as {
      name: string | null
    } | null
    return {
      id: b.id,
      title: planner?.name ?? 'Bokning',
      date: b.event_date,
      amountOre: b.price_ore,
      status: b.payment_status,
    }
  })

  return (
    <AccountLayout doneHref="/dashboard/account">
      <YourPaymentsView payments={payments} backHref="/dashboard/account?s=payments" />
    </AccountLayout>
  )
}
