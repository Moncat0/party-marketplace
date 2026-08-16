import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/AccountLayout'
import PlannerAccountSettings from './PlannerAccountSettings'
import type { SettingsSection } from '@/components/settings/AccountSettingsForm'

export const metadata = { title: 'Inställningar' }
export const dynamic = 'force-dynamic'

function parseSection(s: string | undefined): SettingsSection {
  if (
    s === 'personal' ||
    s === 'security' ||
    s === 'privacy' ||
    s === 'notifications' ||
    s === 'payments'
  ) {
    return s
  }
  return 'personal'
}

export default async function PlannerAccountPage({
  searchParams,
}: {
  searchParams: { s?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const [{ data: userData }, { data: providerProfile }] = await Promise.all([
    supabase
      .from('users')
      .select(
        'name, first_name, last_name, preferred_first_name, phone, auth_provider, privacy_read_receipts, privacy_review_show_city, privacy_review_show_booked_services, notif_marketing, notif_booking_accepted, notif_booking_declined, notif_new_message, notif_review_reminder, notif_provider_news, notif_provider_regs, notif_festen_news, notif_festen_feedback'
      )
      .eq('id', user.id)
      .single(),
    supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return (
    <AccountLayout doneHref="/planner/dashboard">
      <PlannerAccountSettings
        hasProviderProfile={!!providerProfile}
        email={user.email ?? ''}
        firstName={userData?.first_name ?? ''}
        lastName={userData?.last_name ?? ''}
        preferredFirstName={userData?.preferred_first_name ?? ''}
        phone={userData?.phone ?? ''}
        authProvider={userData?.auth_provider ?? null}
        privacyReadReceipts={userData?.privacy_read_receipts ?? true}
        privacyReviewShowCity={userData?.privacy_review_show_city ?? true}
        privacyReviewShowBookedServices={userData?.privacy_review_show_booked_services ?? false}
        initialSection={parseSection(searchParams.s)}
        notificationPrefs={{
          bookingAccepted: userData?.notif_booking_accepted ?? true,
          bookingDeclined: userData?.notif_booking_declined ?? true,
          newMessage: userData?.notif_new_message ?? true,
          reviewReminder: userData?.notif_review_reminder ?? true,
          marketing: userData?.notif_marketing ?? true,
          providerNews: userData?.notif_provider_news ?? true,
          providerRegs: userData?.notif_provider_regs ?? true,
          festenNews: userData?.notif_festen_news ?? true,
          festenFeedback: userData?.notif_festen_feedback ?? true,
        }}
      />
    </AccountLayout>
  )
}
