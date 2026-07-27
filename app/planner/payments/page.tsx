import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/AccountLayout'
import YourPaymentsView, { type PaymentRow } from '@/components/settings/YourPaymentsView'

export const metadata = { title: 'Dina betalningar' }
export const dynamic = 'force-dynamic'

export default async function PlannerPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select(
      'id, event_date, price_ore, payment_status, services!service_id(title, provider_profiles(users(name)))'
    )
    .eq('planner_id', user.id)
    .not('payment_status', 'is', null)
    .order('created_at', { ascending: false })

  const payments: PaymentRow[] = (bookings ?? []).map(b => {
    const raw = b.services as unknown
    const service = (Array.isArray(raw) ? raw[0] : raw) as {
      title: string | null
      provider_profiles: {
        users: { name: string | null } | { name: string | null }[] | null
      } | { users: { name: string | null } | { name: string | null }[] | null }[] | null
    } | null
    const provider = service?.provider_profiles
      ? Array.isArray(service.provider_profiles)
        ? service.provider_profiles[0]
        : service.provider_profiles
      : null
    const users = provider?.users
      ? Array.isArray(provider.users)
        ? provider.users[0]
        : provider.users
      : null
    return {
      id: b.id,
      title: users?.name ?? service?.title ?? 'Bokning',
      date: b.event_date,
      amountOre: b.price_ore,
      status: b.payment_status,
    }
  })

  return (
    <AccountLayout doneHref="/planner/account">
      <YourPaymentsView payments={payments} backHref="/planner/account?s=payments" />
    </AccountLayout>
  )
}
